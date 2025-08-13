import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pythonScriptPath = path.join(__dirname, 'model/use_sample_data.py');

async function testPythonIntegration() {
  console.log('Testing Python integration...\n');

  try {
    // Test demo command
    console.log('1. Testing demo command...');
    const demoResult = await runPythonScript(['--demo']);
    console.log('Demo output:', demoResult.output);
    console.log('Demo error output:', demoResult.errorOutput);
    console.log('');

    // Test generate command
    console.log('2. Testing generate command...');
    const generateResult = await runPythonScript(['--generate']);
    console.log('Generate output:', generateResult.output);
    console.log('Generate error output:', generateResult.errorOutput);
    console.log('');

  } catch (error) {
    console.error('Python integration test failed:', error.message);
  }
}

function runPythonScript(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: python ${pythonScriptPath} ${args.join(' ')}`);
    
    const pythonProcess = spawn('python', [pythonScriptPath, ...args]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ output, errorOutput });
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}

testPythonIntegration();
