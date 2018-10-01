// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="application.js" />

"use strict";

(function (global, $) {
    // This is the entry point of the application.
    // We just call the main function when the whole HTML is ready to use.

    $(function main() {

        // This is the sample code that will be set at startup.
        // You can update it how you would like to do that :-)

        const SampleCode = `\
program MyProgram
{  
    let welcome  "Hello!"                                            ;    
    cmd speak    welcome + " How is it going?" and "UK English Male" ;
    cmd speak    welcome + " Hogy vagy?"       and "Hungarian Female";
    cmd dialog   welcome                                             ;
}`;

        // Create a new Application object and set it as a member of the global object
        // to make it available to every component in the entire life-cycle of the application.
        // For more details see: application.js file

        global.Application = new Application({
            codeSample: SampleCode,
            codeEditor: $("#code-editor"),
            messageOutput: $("#message-output"),
            lexerOutput: $("#lexer-output"),
            syntaxOutput: $("#syntax-output"),
            emitterOutput: $("#output-code")
        });
    });

})(this, jQuery);