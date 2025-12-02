const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const builtInCommands = ["echo", "exit", "type", "pwd", "cd","ls"];

rl.setPrompt(`$ `);
rl.prompt();

function parseArguments(input) {
  let args = [];
  let current = "";
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "'" && !inSingleQuote) {
      inSingleQuote = true;
      continue;
    }
    if (char === "'" && inSingleQuote) {
      inSingleQuote = false;
      continue;
    }
    if (!inSingleQuote && /\s/.test(char)) {
      if (current.length > 0) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current.length > 0) {
    args.push(current);
  }
  return args;
}
rl.on(`line`, (question) => {
  const parts = parseArguments(question);
  const commands = parts[0];
  const args = parts.slice(1);

  if (question === `exit`) {
    console.log(question);
    rl.close();
    return;
  }
  if (question.startsWith("echo ")) {
    console.log(args.join(" "));
    rl.prompt();
    return;
  }
  if(commands==="ls"){
      fs.readdir(process.cwd(), (err, files) => {
        if(err){
          console.log(`Error Reading directory:`);
          return;
        }
    files.forEach(file => {
      console.log(file);
      
    });
    rl.prompt()
    return
  });
  
    }

  if (question === `pwd`) {
    console.log(process.cwd());
    rl.prompt();
    return;
  }
  if (commands === "cd") {
    const HOME = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH 
    
    if (args.length === 0) {
      try{
      process.chdir(HOME);

      }catch(err){
        console.log(`cd:${HOME}: No such file or directory found`)
      }
      rl.prompt();
      return;
    }
    let target=args.join("")
 
    if(target.startsWith('"')&&target.endsWith('"') || (target.startsWith("'")&&target.endsWith("'"))){
      target=target.slice(1,-1)
    }

    target=target.replace(/\\/g,"/");

    if (target && target.startsWith("~")) {
      target = target.replace("~", HOME);
    }
    try {
      process.chdir(target);
    } catch (err) {
      console.log(`cd: ${args[0]}: No such file or directory`);
    }
    rl.prompt();
    return;
  }

  if (question.startsWith("type ")) {
    const commandsInput = question.slice(5);

    if (builtInCommands.includes(commandsInput)) {
      console.log(`${commandsInput} is a shell builtin`);
      rl.prompt();
      return;
    }

    const dirs = process.env.PATH.split(":");
    let found = false;

    for (const dir of dirs) {
      const fullPath = path.join(dir, commandsInput);

      if (fs.existsSync(fullPath)) {
        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          console.log(`${commandsInput} is ${fullPath}`);
          found = true;
          break;
        } catch {
          continue;
        }
      }
    }

    if (!found) {
      console.log(`${commandsInput}: not found`);
    }

    rl.prompt();
    return;
  }

  if (!builtInCommands.includes(commands)) {
    const dirs = process.env.PATH.split(":");
    for (const dir of dirs) {
      const fullPath = path.join(dir, commands);
      if (fs.existsSync(fullPath)) {
        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          const child = spawn(fullPath, args, {
            stdio: "inherit",
            argv0: commands,
          });
          child.on("close", () => rl.prompt());
          child.on("error", () => {
            console.log(`Error executing ${commands}`);
            rl.prompt();
          });
          return;
        } catch (error) {
          continue;
        }
      }
    }
  }
  console.log(`${question}: command not found`);
  rl.prompt();
});
