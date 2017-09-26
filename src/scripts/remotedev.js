// const remotedev = require('remotedev-server');
// import * as vscode from 'vscode';
// import * as $ from 'jquery';
// import $ from 'jquery';

// vscode.window.showInformationMessage('excuting script');

// remotedev({
//     hostname: '127.0.0.1',
//     port: 1024,
// });

// $(document).ready(function() {
// window.testFunction = function() {
//     testFunction();
// } 
// });

// $(function(){
//     window.foo = function foo() {
//         console.log('foo');
//     }
// });

// $(document).ready(function() {
//     console.log('ready 1');
//     function testFunction() {
//         console.log('I am a test callback!');
//     }
// });

$(function() {
    function hello() {
        console.log("Hello, world!!!!!");
    }
    window.hello=hello;
});

// function testFunction() {
//     console.log('testFunction');
// };