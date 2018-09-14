(function () {

    global.ajaxFormdebugMode = typeof global.ajaxFormdebugMode === 'undefined' ? false : global.ajaxFormdebugMode;
    global.handleAjaxResponse = function (data) {
        var reloadDatatable = true;
        var delay = 0;

        if (typeof data.options === 'object') {
            if (typeof data.options.dontReloadDatatable !== 'undefined') {
                reloadDatatable = !data.options.dontReloadDatatable;
            }

            if (typeof data.options.closeModal !== 'undefined') {
                delay = 300;
                $('.modal').modal('hide');
            }
        }

        setTimeout(function () {


            if (reloadDatatable) {
                var datatable_load = $('.datatable-load');
                if (datatable_load.length) datatable_load.dataTable().api().ajax.reload();
            }

            if (typeof data.elements === 'object') {
                $.each(data.elements, function (key, value) {

                    if (typeof value === 'object') {
                        $.each(value, function (attribute, v) {
                            if (attribute === 'html') {
                                $(key).html(v);
                            } else if (attribute === 'methods' && typeof v === 'object') {
                                $.each(v, function (method, parameters) {
                                    $(key)[method](parameters);
                                });
                            } else {
                                if (attribute === 'value') {
                                    $(key).val(v);
                                } else {
                                    $(key).attr(attribute, v);
                                }
                            }
                        });
                    } else {

                        $(key).html(value);
                    }
                });
            }

            if (typeof data.replaceElements === 'object') {
                $.each(data.replaceElements, function (key, value) {

                    var element = $(key);
                    var wrapper = element.wrap('<div class="wrapper"></div>').parent();
                    wrapper.html(value);
                    var html = wrapper.html();

                    wrapper.parent().append(html);
                    wrapper.remove();
                });
            }

            if (typeof data.addElements === 'object') {
                $.each(data.addElements, function (method, el_data) {
                    $.each(el_data, function (element, content) {
                        $(element)[method](content);
                    });
                });
            }

            if (typeof data.removeElements === 'object') {
                $.each(data.removeElements, function (index, element) {
                    $(element).remove();
                });
            }

            if (typeof data.redirect === 'string') {
                window.location.href = data.redirect;
            }

            if (typeof data.callbacks === 'object') {
                $.each(data.callbacks, function (name, parameters) {
                    window[name](parameters);
                });
            }

            if (typeof window.swal !== 'undefined') {
                if (typeof data.swal === 'object' || typeof data.swal === 'boolean') {

                    var options = {};
                    if (typeof data.swal.options === 'object') {
                        options = data.swal.options;
                    }

                    options.type = typeof data.swal.type !== 'undefined' ? data.swal.type : 'success';
                    options.title = typeof data.swal.title !== 'undefined' ? data.swal.title : 'Succès';
                    options.text = typeof data.swal.text !== 'undefined' ? data.swal.text : 'Enregistrement effectué avec succès';

                    swal(options);
                }
            }


            if (typeof window.initSelect2 !== 'undefined') initSelect2();
            if (typeof window.initPopover !== 'undefined') initPopover();
            if (typeof window.initNumeric !== 'undefined') initNumeric();

        }, delay);

    };
    global.fd = {};

    var buttonClicked = null;
    var _body = $('body');
    var sendTimeout;
    var submitAjaxForm = function (button, sendDelay) {
        if (typeof sendDelay === 'undefined') sendDelay = 0;
        clearTimeout(sendTimeout);
        sendTimeout = setTimeout(function () {
            button.closest('.ajax-form').trigger('submit');


        }, sendDelay);
    };

    _body.on('click', '.ajax-form button', function (e) {
        buttonClicked = $(this);
    });

    _body.on('change', '.send-on-change', function (e) {
        submitAjaxForm($(this));
    });

    _body.on('blur', '.send-on-blur', function (e) {
        submitAjaxForm($(this));
    });

    _body.on('keyup', '.send-on-keyup', function (e) {
        submitAjaxForm($(this), 70);
    });

    _body.on('keypress', '.send-on-keypress', function (e) {
        submitAjaxForm($(this), 70);
    });

    _body.on('keydown', '.send-on-keydown', function (e) {
        submitAjaxForm($(this), 70);
    });

    var ajaxFormSubmit = function (_form) {

        var formData = new FormData(_form[0]);

        if (buttonClicked != null) {
            formData.append('buttonClickedName', buttonClicked.attr('name'));
            formData.append('buttonClickedValue', buttonClicked.attr('value'));
        }

        var redirect_after_request = _form.attr('data-redirect-after-request');
        var loadingOverlay = _form.attr('data-loadingOverlay');
        var loadingOverlayContainer;
        if (typeof loadingOverlay !== 'undefined') {
            loadingOverlayContainer = $(loadingOverlay);
            if (!loadingOverlayContainer.length) {
                loadingOverlayContainer = _form.parent();
            }

            loadingOverlayContainer.LoadingOverlay('show');
        }

        $.ajax({
            url: _form.attr('action'),
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: _form.attr('method'),
            success: function (data) {
                _body.trigger('click');
                var empty_form = _form.attr('data-empty-form');


                if (typeof empty_form !== 'undefined') {
                    for (var pair of formData.entries()) {
                        $('input[name="' + pair[0] + '"]').val('');
                        $('select[name="' + pair[0] + '"]').val('');
                        $('textarea[name="' + pair[0] + '"]').val('');
                    }
                }
                handleAjaxResponse(data);

            }
        }).always(function (data) {
            $('.invalid-feedback', _form).remove();
            $('.is-invalid', _form).removeClass('is-invalid');
            window.onbeforeunload = null;
            if (typeof loadingOverlayContainer !== 'undefined') loadingOverlayContainer.LoadingOverlay('hide');
        }).fail(function (data) {
            var errors = data.responseJSON.errors;
            $.each(errors, function (key, value) {
                var el = $('[name="' + key + '"]', _form);
                if (!el.hasClass('is-invalid')) el.addClass('is-invalid');
                var html = '<div class="invalid-feedback">';
                $.each(value, function (i, error) {
                    html += '<li>' + error + '</li>';
                });
                html += "</div>";
                el.after(html);
            })
        });

        if (redirect_after_request) {
            setTimeout(function () {
                window.location.href = redirect_after_request;
            }, 400);
        }
    };

    _body.on('submit', '.ajax-form', function (e) {

        e.preventDefault();
        var _form = $(this);
        var swal_confirm = _form.attr('data-swal-confirm');


        if (swal_confirm) {
            swal({
                type: 'warning',
                title: 'Confirmation',
                text: 'Cette action nécessite une confirmation de votre part. Souhaitez-vous continuer ?',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Continuer',
                cancelButtonText: 'Annuler'
            }).then(function (result) {
                if (result.value) {
                    ajaxFormSubmit(_form);
                }
            });
        } else {
            ajaxFormSubmit(_form);
        }


    });

    if (global.ajaxFormdebugMode) {

        $('.ajax-form').each(function (i, v) {
            var _this = $(this);
            var _form = _this.closest('form');
            _form.css('border', '1px solid black');
            _this.prepend('<div><input name="ajax_form_enabled_' + i + '" type="checkbox" value="1" id="ajax_form_enabled_' + i + '" class="ajax_form_enabled" checked/><label for="ajax_form_enabled_' + i + '">[DEV] Send this form using ajax</label></div>');
        });

        $('body').on('change', '.ajax_form_enabled', function () {
            var _this = $(this);
            var _form = _this.closest('form');
            var checked = _this.prop('checked');

            if (checked) {
                _form.addClass('ajax-form');
            } else {
                _form.removeClass('ajax-form');
            }
        });
    }


}());