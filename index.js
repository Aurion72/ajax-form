let $ = require('jquery');
let swal = require('sweetalert2');
require('gasparesganga-jquery-loading-overlay');
let token = document.head.querySelector('meta[name="csrf-token"]');

$.ajaxSetup({
    headers: {'X-CSRF-TOKEN': token.content}
});

class AjaxForm {
    constructor(id, options) {
        this._form = $(id);
        this._form.data('ajaxform', true);
        this._formData = new FormData;
        this.buttonClicked = null;
        this.initEvent();
        this.sendTimeout = setTimeout(() => {
        });
        this.options = Object.assign({
            debugMode: false,
            sendTimeoutDelay: 70,
            confirmSwal: {
                type: 'warning',
                title: 'Confirmation',
                text: 'Are you sure?',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel'
            },
            redirectAfterRequestIsSent : false,
            loadingOverlay: $('body'),
            ajaxDoneCallback: function (data, textStatus, jqXHR) {
                //console.log("done");
            },
            ajaxAlwaysCallback: function (data, textStatus, jqXHR) {
                //console.log("always");
            },
            ajaxFailCallback: function (jqXHR, textStatus, errorThrown) {
                //console.log("fail");
            },
            cleanForm: false
        }, options);

        this.options = Object.assign(this.options, this._form.data());
        this.debug();
    }

    getConfirmSwal() {
        return swal(this.options.confirmSwal).then((result) => {
            if (result.value) {
                this.submitWithDelay();
            }
        });
    }

    initEvent() {

        this._form.on('click', 'button', (e) => {
            this.buttonClicked = $(e.currentTarget);
        });

        this._form.on('change', '.ajaxform-submit-on-change', () => {
            this.submitWithDelay();
        });

        this._form.on('blur', '.ajaxform-submit-on-blur', () => {
            this.submitWithDelay();
        });

        this._form.on('keyup', '.ajaxform-submit-on-keyup', () => {
            this.submitWithDelay();
        });

        this._form.on('keypress', '.ajaxform-submit-on-keypress', () => {
            this.submitWithDelay();
        });

        this._form.on('keydown', '.ajaxform-submit-on-keydown', () => {
            this.submitWithDelay();
        });

        this._form.on('submit', (e) => {

            let checkbox = $('input[name="ajax-form-debug-checkbox"]', this._form);
            if (checkbox.length && !checkbox.prop('checked')) {
                e.currentTarget.submit();
                return false;
            }


            e.preventDefault();
            let swal_confirm = this._form.attr('data-swal-confirm');
            if (swal_confirm) {
                this.getConfirmSwal();
            } else {
                this.submitWithDelay();
            }


        });

    }

    submitWithDelay() {
        clearTimeout(this.sendTimeout);
        this.sendTimeout = setTimeout(() => {
            this.submit();
        }, this.options.sendTimeoutDelay);
    };

    loadingOverlay(active = true) {
        if (this.options.loadingOverlay !== null) {
            if (this.options.loadingOverlay === 'this') this.options.loadingOverlay = this._form;
            if (this.options.loadingOverlay === 'parent') this.options.loadingOverlay = this._form.parent();
            $(this.options.loadingOverlay).LoadingOverlay(active ? 'show' : 'hide');
        }
    }

    generateFormData() {
        this._formData = new FormData(this._form[0]);
        if (this.buttonClicked != null) {
            this._formData.append('buttonClickedName', this.buttonClicked.attr('name'));
            this._formData.append('buttonClickedValue', this.buttonClicked.attr('value'));
        }
    }

    cleanForm() {
        if (this.options.cleanForm) {
            for (let pair of this._formData.entries()) {
                $(`[name="${pair[0]}"]:visible`, this._form).val('');
            }
        }
    }

    redirectAfterRequestIsSent() {
        if (this.options.redirectAfterRequestIsSent !== false) {
            setTimeout(function () {
                window.location.href = this.options.redirectAfterRequestIsSent;
            }, 400);
        }
    }

    submit() {
        this.generateFormData();
        this.loadingOverlay(true);

        $.ajax({
            url: this._form.attr('action'),
            data: this._formData,
            cache: false,
            contentType: false,
            processData: false,
            type: this._form.attr('method')
        }).done((data, textStatus, jqXHR) => {
            this.cleanForm();
            this.options.ajaxDoneCallback(this._form, data, textStatus, jqXHR);
        }).always((data, textStatus, jqXHR) => {
            this.loadingOverlay(false);
            this.options.ajaxAlwaysCallback(this._form, data, textStatus, jqXHR);
            AjaxForm.autoload();
        }).fail((jqXHR, textStatus, errorThrown) => {
            this.options.ajaxFailCallback(this._form, jqXHR, textStatus, errorThrown);
        });

        this.redirectAfterRequestIsSent();
    };

    static initAutoload(elementConfiguration) {
        AjaxForm.autoloadOn = elementConfiguration;
        AjaxForm.autoload();
    }

    static autoload() {
        if (AjaxForm.autoloadOn.length) {
            AjaxForm.autoloadOn.forEach((elementConfiguration) => {
                $(elementConfiguration.element).each((i, v) => {
                    if ($(v).data('ajaxform')) return true;
                    new this($(v), elementConfiguration.options);
                });
            });
        }
    }

    debug() {
        if (this.options.debugMode === true) {
            this._form.css('border', '1px solid black');
            this._form.prepend('<div class="ajax-form-debug-area"><input name="ajax-form-debug-checkbox" type="checkbox" value="1" checked/><label>[AJAXFORM DEBUG] Send using ajax</label></div>');
        }
    }
}

AjaxForm.autoloadOn = [];

module.exports = AjaxForm;