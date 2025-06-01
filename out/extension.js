"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.highlightSampleRange = highlightSampleRange;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
var diagnosticCollection = vscode.languages.createDiagnosticCollection('asampl');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension is now active!');
    //launching terminal
    const terminal = vscode.window.createTerminal("ASAMPL Terminal");
    // Invoker of the java code is implemented with registerCommand
    // The commandId parameter 'asampl.runInterpreter' must match the command field in package.json
    const javaInvoker = vscode.commands.registerCommand('asampl.runInterpreter', async () => {
        //editor is the extension text editor itself
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Файл не відкрито');
            return;
        }
        //document is the document that is currently being ediited
        const document = editor.document;
        const code = document.getText();
        //Creating channel for showing information
        const outputChannel = vscode.window.createOutputChannel("ASAMPL Output");
        //Writing code in the temporary file
        const tmpFilePath = path.join(context.extensionPath, 'temp.as2');
        fs.writeFileSync(tmpFilePath, code, 'utf8');
        //Launching java interpreter
        const jarPath = path.join(context.extensionPath, 'javasrc', 'asampl_2_0_compiler.jar');
        const javaProcess = (0, child_process_1.execFile)('java', ['-jar', jarPath, tmpFilePath], (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Помилка виконання інтерпретатора: ${stderr || error.message}`);
                return;
            }
            var splitted = stdout.split(" ");
            //Clear errors
            diagnosticCollection.set(document.uri, []);
            //Output
            if (splitted.length > 3 && !isNaN(Number(splitted[splitted.length - 1])) && !isNaN(Number(splitted[splitted.length - 4]))) {
                highlightSampleRange(Number(splitted[splitted.length - 4]) - 1, Number(splitted[splitted.length - 1]) - 1, String(stdout.split("pos:", 1)));
            }
            else if (splitted.length > 3 && splitted[splitted.length - 2] === "line:") {
                highlightSampleRange(Number(splitted[splitted.length - 1]) - 1, 0, String(stdout.split("pos:", 1)));
            }
            else {
                outputChannel.show();
                outputChannel.appendLine(stdout);
                vscode.window.showInformationMessage(`Результат виконання:\n${stdout}`);
            }
        });
    });
    //Registering command in the extension, it is available through Ctrl+Shift+P
    context.subscriptions.push(javaInvoker);
}
//This function is highlighting errors based on the position and the text of the error
function highlightSampleRange(row = 0, pos = 0, errtext = "") {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Немає відкритого редактора');
        return;
    }
    const document = editor.document;
    const diagnostics = [];
    //Creating range
    const start = new vscode.Position(row, pos);
    const end = new vscode.Position(row, pos);
    const range = new vscode.Range(start, end);
    const diagnostic = new vscode.Diagnostic(range, errtext, vscode.DiagnosticSeverity.Error);
    diagnostic.source = 'asampl';
    diagnostics.push(diagnostic);
    diagnosticCollection = vscode.languages.createDiagnosticCollection('asampl');
    diagnosticCollection.set(document.uri, diagnostics);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map