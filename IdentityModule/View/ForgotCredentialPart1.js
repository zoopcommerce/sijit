define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',
    'dijit/_Widget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'Sds/Common/Form/_ValidationMixin',
    'Sds/View/BaseView',
    'Sds/IdentityModule/ViewModel/ForgotCredentialPart1',
    'Sds/View/formFactory',
    'dojo/text!../Template/ForgotCredentialPart1.html',
    'Sds/Common/Dialog'
],
function(
    declare,
    lang,
    Deferred,
    Widget,
    TemplatedMixin,
    WidgetsInTemplateMixin,
    ValidationMixin,
    BaseView,
    RecoverPasswordPart1ViewModel,
    formFactory,
    template
){
    return declare(
        'Sds/IdentityModule/View/ForgotCredentialPart1',
        [
            Widget,
            TemplatedMixin,
            WidgetsInTemplateMixin,
            BaseView
        ],
        {
            templateString: template,

            valueType: RecoverPasswordPart1ViewModel,

            inputsAppended: false,

            postCreate: function(){

                // Extend the dialogNode so it can handle form validators
                declare.safeMixin(this.dialogNode, new ValidationMixin);
                this.dialogNode._messageStyleNode = this.formValidatorMessage;
                this.dialogNode.blockMessage = this.blockMessage;
                this.dialogNode.inlineMessage = this.inlineMessage;
                this.dialogNode.watch('value', lang.hitch(this, function(){
                    this.dialogNode._validate();
                }));

                this.inherited(arguments);

                document.body.appendChild(this.domNode);
            },

            activate: function(value){

                this.inherited(arguments);

                if ( ! value){
                    value = new RecoverPasswordPart1ViewModel;
                    this.set('value', value);
                }

                this._appendInputs().then(lang.hitch(this, function(){
                    this.startup();
                    this.dialogNode.show(value).then(lang.hitch(this, function(){
                        this._resolve();
                    }));
                }));

                return this._activateDeferred;
            },

            deactivate: function(){
                this.dialogNode.hide();
                this.inherited(arguments);
            },

            reset: function(){
                this.dialogNode.reset();
            },

            _appendInputs: function(){
                var appendInputsDeferred = new Deferred;

                if ( ! this.inputsAppened){
                    var metadata = RecoverPasswordPart1ViewModel.metadata;
                    metadata.containerNode = this.containerNode;
                    formFactory.appendToForm(this.dialogNode, metadata).then(lang.hitch(this, function(){
                        this.inputsAppened = true;
                        appendInputsDeferred.resolve();
                    }));
                } else {
                    appendInputsDeferred.resolve();
                }
                return appendInputsDeferred;
            },

            _getStateAttr: function(){
                if (this.dialogNode.get('button') == 'ok'){
                    return this.dialogNode.get('state');
                } else {
                    return this.dialogNode.get('button');
                }
            },

            _getValueAttr: function(){
                this.value = lang.mixin(this.value, this.dialogNode.get('value').value);
                return this.value;
            }
        }
    );
});