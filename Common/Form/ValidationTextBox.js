define([
    'dojo/_base/declare',
    'dijit/_Widget',
	'dijit/_TemplatedMixin',
    'Sds/Common/Form/_TextBoxMixin',
    'Sds/Common/Form/_ValidationMixin',
    'dojo/text!./Template/ValidationTextBox.html'
],
function (
    declare,
    Widget,
    TemplatedMixin,
    TextBoxMixin,
    ValidationMixin,
    template
){
    return declare(
        'Sds/Common/Form/ValidationTextBox',
        [Widget, TemplatedMixin, TextBoxMixin, ValidationMixin],
        {
            templateString: template,

            // message: String
            //		Currently error/prompt message.
            message: '',

            postCreate: function(){
                this._messageStyleNode = this.domNode;
                this.inherited(arguments);
            }
        }
    );
});
