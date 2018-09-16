# ABOUT
AjaxForm is a Javascript package that can send any regular form as an Ajax request.

# INSTALLATION
You can require this package via Npm with
`npm install aurion72-ajaxform`

# USAGE
AjaxForm must be attached to a form element. Once it's done, this form will be sent using Ajax. The most basic usage looks like this:

```js
new AjaxForm(formElement, options);
```

You can also set an autoloader to convert every forms that match a specific selector.
```js
AjaxForm.initAutoload([
    {
        element: '.your_class_or_any_other_selector',
        options: options
    },
    {
        element: 'tag[name="something_else"]',
        options: other_options
    },
]);
```

There are some options available:

`debugMode : true|false`
Add a checkbox inside every forms that use the plugin to test them without Ajax

`loadingOverlay : '#element'`
Add a loading overlay that will appear inside the #element. Other possible values are 'this', 'parent' and null (disabled)

`cleanForm : true|false`
Empty all inputs / selects / textarea after sending the form

Three callbacks are available:

`ajaxDoneCallback(form, data, textStatus, jqXHR)`
Where form is the current form that triggered the callback. Called when the request is successful.

`ajaxAlwaysCallback(form, data|jqXHR, textStatus, jqXHR|errorThrown)`
Where form is the current form that triggered the callback. Called after each request.

`ajaxFailCallback(form, jqXHR, textStatus, errorThrown)`
Where form is the current form that triggered the callback. Called when the request failed.

# Road Map
Add unit tests, add more options to allow a better customization, rewrite the documentation.
