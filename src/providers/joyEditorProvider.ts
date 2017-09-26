import * as vscode from 'vscode';
import * as path from 'path';
const fs = require('fs');

/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
import $ = require('jquery');

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
    var filename = vscode.window.activeTextEditor.document.fileName;
    console.log(`File to Parse...`);
    console.log(`relativePath: ${relativePath}`);
    console.log(`filename: ${filename}`);
    
    let fileReadString : string;

    // parse file
    if (fs.existsSync (filename)) {
      console.log('file exists...');
      fileReadString = fs.readFileSync(filename, 'utf8');
      console.log(`file data: ${JSON.stringify(fileReadString, null, 4)}`);          
    }

    // return JSON object as a string
    var returnString = JSON.stringify(returnString, null, 4) || ''; // prettify and return

    var relativePath = path.dirname(__dirname);
    console.log(`relative path: ${relativePath}`);
    
    _providerHtml = `
    <head>
        <title>Be Brief!</title>
        <script type="text/javascript" src="${relativePath}/../../assets/brief/jquery.min.js"></script>        
        <link rel="Stylesheet" href="${relativePath}/../../assets/brief/Default.css" type="text/css" />
        <link rel="Stylesheet" href="${relativePath}/../../assets/brief/Editor.css" type="text/css" />
        <script type="text/javascript" src="${relativePath}/../../assets/brief/test.js"></script>                
        <script type="text/javascript" src="${relativePath}/../../assets/brief/Engine.js"></script>
        <script type="text/javascript" src="${relativePath}/../../assets/brief/Editor.js"></script>
        <script>
        /* When the user clicks on the button,
        toggle between hiding and showing the dropdown content */
        function myFunction() {
            document.getElementById("dropdown-dictionary").classList.toggle("show");
        }
        
        function filterFunction() {
            var input, filter, ul, li, a, i;
            input = document.getElementById("dropdown-search");
            filter = input.value.toUpperCase();
            div = document.getElementById("dropdown-dictionary");
            a = div.getElementsByTagName("a");
            for (i = 0; i < a.length; i++) {
                if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
                    a[i].style.display = "";
                } else {
                    a[i].style.display = "none";
                }
            }
        }

        // Close the dropdown if the user clicks outside of it
        window.onclick = function(event) {
          console.log(JSON.stringify(event.target));
          if (!event.target.matches('.dropbtn')) {
        
            if(event.target.matches('.drop-input')) {
              console.log('.drop-input found!');
              event.target.focus();
              event.preventDefault();              
              return;
            } else if (event.target.matches('.drop-element')) {
              console.log('.drop-element found!');
              // event.target.focus();
              return;              
            }

            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
              var openDropdown = dropdowns[i];
              console.log(i);
              if (openDropdown.classList.contains('show')) {
                console.log(openDropdown);
                openDropdown.classList.remove('show');
              }
            }
          }
        }
        </script>
        <script type="text/brief">
        </script>
    </head>
    <body>
        <h1>Joy Editor</h1>
        <div id="demo"></div>
        <hr />
        <div class="title-container">
          <div class="title-header">Interactive Editor</div>        
          <div id="input"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Stack Results</div>  
          <div id="context"></div>
        </div>
        <hr />        
        <div class="title-container">
          <div class="title-header">Dictionary Definitions</div>        
          <div id="dictionary"></div>
        </div>
        <hr />                
        <div class="title-container">
          <div class="title-header">Raw Text</div>        
          <div id="output"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Error Console</div>        
          <div id="error"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Dictionary Explorer</div>        
          <div class="dropdown">
          <div class="container">          
            <button onclick="myFunction()" class="dropbtn">Dictionary</button>
            <div id="dropdown-dictionary" class="dropdown-content">
              <input id="dropdown-search" class="drop-input" type="text" placeholder="Search.." onkeyup="filterFunction()">
              <a class="drop-element" href="#about">About</a>
              <a class="drop-element" href="#base">Base</a>
              <a class="drop-element" href="#blog">Blog</a>
              <a class="drop-element" href="#contact">Contact</a>
              <a class="drop-element" href="#custom">Custom</a>
              <a class="drop-element" href="#support">Support</a>
              <a class="drop-element" href="#tools">Tools</a>
            </div>
            <div id="element-defintion"><span>hi</span></div>          
          </div>                        
        </div>
        </div>
        <hr />
        <h2><a target="_blank" href="http://youtu.be/R3MNcA2dpts?hd=1">Demo based off forked "Be Brief!" Editor</a></h2>
        <p>Forked from <a target="_blank" href="https://github.com/AshleyF/brief">"Be Brief!" Editor (@author AshleyF)</a></p>
        <ul>
            <li>Use the "words" to discover available word commands and functions</li>
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