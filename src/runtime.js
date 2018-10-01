// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

"use strict";

(function (global, window, $) {

    let stateMachine = $.Deferred().resolve();

    function __await(asyncFunction, thisArg) {
        return (...args) => stateMachine = stateMachine.then(asyncFunction.bind(thisArg, ...args));
    }

    /** The function "speak" calls into responsive voice API (http://responsivevoice.org) */
    global["speak"] = __await((text, voice) => {
        text = text || "Hello!";
        const deferred = $.Deferred();
        responsiveVoice.speak(text, voice, { volume: 1, onend: () => { deferred.resolve(); } });
        return deferred;
    });

    /** The function "search" starts to search some content  using one of the internet search engines. */
    global["search"] = __await(text =>
        window.open(`http://www.bing.com/search?q=${global.encodeURIComponent(text)}`, "blank"));

    /** The function "dialog" displays a modal dialog window using Bootstrap. */
    global["dialog"] = __await(text => {
        $(`
<div class="modal fade">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Sample Program</h4>
            </div>
            <div class="modal-body">${text}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>`).modal({ show: true });
    });

})(this, window, jQuery);