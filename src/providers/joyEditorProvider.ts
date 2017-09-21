import * as vscode from 'vscode';
import * as path from 'path';

var _joyExtension = "joy";
var _providerHtml = "";

type socketOptions = {
  hostname: string
  port: number
}

export class JoyEditorProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  
  private socketOptions = {
    hostname: '127.0.0.1',
    port: 1024,
  };

  public constructor(options: socketOptions) {
    this.socketOptions = options;
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.createJoyEditorPreview(uri);
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  public update(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  public createJoyEditorPreview(uri: vscode.Uri): string {
    const reason = "Active editor doesn't show a JOY script - please open one and/or relaunch the Joy Editor extension.";
    if(typeof vscode.window.activeTextEditor === 'undefined' || !vscode.window.activeTextEditor.document.fileName.endsWith(_joyExtension)){
      // close the extension and force the user to re-launch
      // vscode.commands.executeCommand(
      //   'workbench.action.closeActiveEditor',
      // ).then((success) => {
      //   console.log('closing the Joy Editor extension')
      // }, (reason) => {
      //   vscode.window.showErrorMessage(reason);
      // });
      _providerHtml = this.errorPreview(reason);
      return _providerHtml
    }
      return this.joyEditorPreview(uri);
  }

  private joyEditorPreview(uri: vscode.Uri): string {

    var relativePath = path.dirname(__dirname);
    _providerHtml = `
    <head>
        <title>Be Brief!</title>
        <link rel="Stylesheet" href="${relativePath}/../../assets/brief/Default.css" type="text/css" />
        <link rel="Stylesheet" href="${relativePath}/../../assets/brief/Editor.css" type="text/css" />
        <script type="text/javascript" src="${relativePath}/../../assets/brief/jquery-1.6.2.min.js"></script>
        <script type="text/javascript" src="${relativePath}/../../assets/brief/Engine.js"></script>
        <script type="text/javascript" src="${relativePath}/../../assets/brief/Editor.js"></script>
        <script type="text/brief">
        </script>
    </head>
    <body>
        <h1>Joy Editor</h1>
        <div id="demo"></div>
        <hr />
        <div id="input"></div>
        <hr />
        <div id="context"></div>
        <hr />
        <div id="dictionary"></div>
        <div id="output"></div>
        <br />
        <hr />
        <h2><a target="_blank" href="http://youtu.be/R3MNcA2dpts?hd=1">Demo based off forked "Be Brief!" Editor</a></h2>
        <p>Forked from <a target="_blank" href="https://github.com/AshleyF/brief">"Be Brief!" Editor (@author AshleyF)</a></p>
        <ul>
            <li>Use the "words" word to discover available, um words...</li>
            <li>Arrow keys to move cursor (CTRL+arrows to skip quotations)</li>
            <li>Hold Shift to select while moving</il>
            <li>CTRL-Q quotes selection</li>
            <li>Square brackets for quotations</li>
            <li>Double quotes for strings</li>
        </ul>
    </body>`;
    return _providerHtml;
  }

  public getProviderHtml(): string {
    return _providerHtml;
  }

  private errorPreview(error: string): string {
    return `
      <body>
        ${error}
      </body>`;
  }
}