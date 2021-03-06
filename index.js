var fs = require('fs');
var ejs = require('ejs');
var juice = require('juice');

// Package constructor
function Mailgen(options) {
    // Set options as instance members
    this.theme = options.theme;
    this.product = options.product;
    this.themeName = (typeof this.theme === 'string' && this.theme) ? this.theme : 'default';

    // No product?
    if (!this.product || typeof this.product !== 'object') {
        throw new Error('Please provide the `product` object.');
    }

    // No product name or link?
    if (!this.product.name || !this.product.link) {
        throw new Error('Please provide the product name and link.');
    }

    // Cache theme files for later to avoid spamming fs.readFileSync()
    this.cacheThemes();
}

Mailgen.prototype.cacheThemes = function () {
    // Build path to theme file (make it possible to pass in a custom theme path, fallback to mailgen-bundled theme)
    var themePath = (typeof this.theme === 'object' && this.theme.path) ? this.theme.path : __dirname + '/themes/' + this.themeName + '/index.html';

    // Bad theme path?
    if (!fs.existsSync(themePath)) {
        throw new Error('You have specified an invalid theme.');
    }

    // Load theme (sync) and cache it for later
    this.cachedTheme = fs.readFileSync(themePath, 'utf8');

    // Build path to plaintext theme file (make it possible to pass in a custom plaintext theme path, fallback to mailgen-bundled theme)
    var plaintextPath = (typeof this.theme === 'object' && this.theme.plaintextPath) ? this.theme.plaintextPath : __dirname + '/themes/' + this.themeName + '/index.txt';

    // Bad plaintext theme path?
    if (!fs.existsSync(plaintextPath)) {
        throw new Error('You have specified an invalid plaintext theme.');
    }

    // Load plaintext theme (sync) and cache it for later
    this.cachedPlaintextTheme = fs.readFileSync(plaintextPath, 'utf8');
};

// HTML e-mail generator
Mailgen.prototype.generate = function (params) {
    // Parse email params and get back an object with data to inject
    var ejsParams = this.parseParams(params);

    // Render the theme with ejs, injecting the data accordingly
    var output = ejs.render(this.cachedTheme, ejsParams);

    // Inline CSS
    output = juice(output);

    // All done!
    return output;
};

// Plaintext text e-mail generator
Mailgen.prototype.generatePlaintext = function (params) {
    // Parse email params and get back an object with data to inject
    var ejsParams = this.parseParams(params);

    // Render the plaintext theme with ejs, injecting the data accordingly
    var output = ejs.render(this.cachedPlaintextTheme, ejsParams);

    // All done!
    return output;
};

// Validates, parses and returns injectable ejs parameters
Mailgen.prototype.parseParams = function (params) {
    // Basic params validation
    if (!params || typeof params !== 'object') {
        throw new Error('Please provide parameters for generating transactional e-mails.');
    }

    // Get body params to inject into theme
    var body = params.body;

    // Basic body validation
    if (!body || typeof body !== 'object') {
        throw new Error('Please provide the `body` parameter as an object.');
    }

    // Prepare data to be passed to ejs engine
    var ejsParams = {
        product: this.product
    };

    // Pass email body elements to ejs
    for (var k in body) {
        ejsParams[k] = body[k];
    }

    return ejsParams;
};

// Expose the Mailgen class
module.exports = Mailgen;
