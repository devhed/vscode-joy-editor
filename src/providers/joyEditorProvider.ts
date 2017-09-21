import * as vscode from 'vscode';
import * as path from 'path';

type socketOptions = {
  hostname: string
  port: number
}

export class JoyEditorProvider implements vscode.TextDocumentContentProvider {
  private socketOptions = {
    hostname: '127.0.0.1',
    port: 1024,
  };

  public constructor(options: socketOptions) {
    this.socketOptions = options;
  }

  public provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
    var relativePath = path.dirname(__dirname);
    console.log(`test ${relativePath}`)
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
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
    </body>
    </html>`
  }
}