module.exports = function () {
    global.handleAjaxResponse = (data) => {
        console.log('aurion-ajax-form-loaded');
        let reloadDatatable = true;
        let delay = 0;

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
                let datatable_load = $('.datatable-load');
                if (datatable_load.length) datatable_load.dataTable().api().ajax.reload();
            }


            if (typeof data.elements === 'object') {
                $.each(data.elements, (key, value) => {

                    if (typeof value === 'object') {
                        $.each(value, (attribute, v) => {
                            if (attribute === 'html') {
                                $(key).html(v);
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
                $.each(data.replaceElements, (key, value) => {

                    let element = $(key);
                    let wrapper = element.wrap('<div class="wrapper"></div>').parent();
                    wrapper.html(value);
                    let html = wrapper.html();

                    wrapper.parent().append(html);
                    wrapper.remove();
                });
            }

            if (typeof data.addElements === 'object') {
                $.each(data.addElements, (method, el_data) => {
                    $.each(el_data, (element, content) => {
                        $(element)[method](content);
                    });
                });
            }

            if (typeof data.removeElements === 'object') {
                $.each(data.removeElements, (index, element) => {
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

            if (typeof data.swal === 'object' || typeof data.swal === 'boolean') {

                let options = {};
                if (typeof data.swal.options === 'object') {
                    options = data.swal.options;
                }

                options.type = typeof data.swal.type !== 'undefined' ? data.swal.type : 'success';
                options.title = typeof data.swal.title !== 'undefined' ? data.swal.title : 'Succès';
                options.text = typeof data.swal.text !== 'undefined' ? data.swal.text : 'Enregistrement effectué avec succès';

                swal(options);
            }

            initSelect2();
            initPopover();
            initNumeric();

        }, delay);

    };
    global.fd = {};
    $(document).ready(function () {
        let buttonClicked = null;
        let _body = $('body');
        let sendTimeout;
        let submitAjaxForm = (button, sendDelay) => {
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

        let ajaxFormSubmit = (_form) => {

            let formData = new FormData(_form[0]);

            if (buttonClicked != null) {
                formData.append('buttonClickedName', buttonClicked.attr('name'));
                formData.append('buttonClickedValue', buttonClicked.attr('value'));
            }

            let loadingOverlay = _form.attr('data-loadingOverlay');
            let loadingOverlayContainer;
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
                success: (data) => {
                    _body.trigger('click');
                    let empty_form = _form.attr('data-empty-form');


                    if (typeof empty_form !== 'undefined') {
                        for (let pair of formData.entries()) {
                            $('input[name="' + pair[0] + '"]').val('');
                            $('select[name="' + pair[0] + '"]').val('');
                            $('textarea[name="' + pair[0] + '"]').val('');
                        }
                    }
                    handleAjaxResponse(data);

                }
            }).always(() => {
                $('.invalid-feedback', _form).remove();
                $('.is-invalid', _form).removeClass('is-invalid');
                window.onbeforeunload = null;
                if (typeof loadingOverlayContainer !== 'undefined') loadingOverlayContainer.LoadingOverlay('hide');
            }).fail((data) => {
                let errors = data.responseJSON.errors;
                $.each(errors, function (key, value) {
                    let el = $('[name="' + key + '"]', _form);
                    if (!el.hasClass('is-invalid')) el.addClass('is-invalid');
                    let html = '<div class="invalid-feedback">';
                    $.each(value, function (i, error) {
                        html += '<li>' + error + '</li>';
                    });
                    html += "</div>";
                    el.after(html);
                })
            });
        };

        _body.on('submit', '.ajax-form', function (e) {

            e.preventDefault();
            let _form = $(this);
            let swal_confirm = _form.attr('data-swal-confirm');

            if (swal_confirm) {
                swal({
                    type: 'warning',
                    title: 'Confirmation',
                    text: 'Cette action nécessite une confirmation de votre part. Souhaitez-vous continuer ?',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Continuer',
                    cancelButtonText: 'Annuler'
                }).then((result) => {
                    if (result.value) {
                        ajaxFormSubmit(_form);
                    }
                });
            } else {
                ajaxFormSubmit(_form);
            }


        });


    });
};

