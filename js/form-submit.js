/**
 * Herringbone Contact Form Client Controller.
 *
 * Control client form submission performed with fetch and the
 * WP REST api. All data transmitted in JSON for adabtability.
 * 
 * @package Herringbone
 * @subpackage HB_Contact_Form
 * @author Jefferson Real <me@jeffersonreal.com>
 * @copyright Copyright (c) 2021, Jefferson Real
 * @license GPL2+
 * 
 */
(function form_sender() {


    /**
     * Grab WP localize vars.
     * 
     * wp_localize_hb_contact_form_vars.*
     * .rest_url;
     * .rest_nonce;
     * .admin_email;
     * 
     */
    wp = wp_localize_hb_contact_form_vars;


    /**
     * Form element vars.
     * 
     * These element vars will be assigned as the form submission
     * is handled and used to provide feedback to the user. They are
     * declared here to provide top-level scope.
     * 
     */
     let button;
     let button_label;
     let output;
     let form_hide;

    /**
     * Prepare the form ready for input.
     * 
     */
    function form_init() {

        // Hide the honeypot input field(s)
        let honeypot = document.querySelectorAll( '.jsSaveTheBees' );
        honeypot.forEach( input => { input.style.display = "none" } );

        // Attach submit listener callback to the form(s)
        document.querySelectorAll( '.jsFormSubmit' ).forEach( form => {
            form.addEventListener( 'submit', handle_form_submit );
        } );
    };


    /**
     * Handle the submitted form.
     * 
     * Process:
     *      fetch    initiate http request using fetch api.
     *      .then    parse json to js object.
     *      .then    process response to user output.
     *      .catch   process errors that came down chain.
     * 
     * @param {SubmitEvent} event
     * 
     */
    async function handle_form_submit( event ) {

        // prevent normal submit action
        event.preventDefault();

        // get the element the event handler was attached to.
        const form = event.currentTarget;

        // if honeypot has a value ( bye bye bot )
        if ( '' != form.querySelector( '[name="required_field"]' ).value ) {
            document.documentElement.remove();
            window.location.replace( "https://en.wikipedia.org/wiki/Robot" );
        }

        // Get elements of submitted form.
        let button = form.querySelector( '.jsButtonSubmit' );
        let button_label = form.querySelector( '.jsButtonSubmit > *:first-child' );
        let button_idle_text = button_label.innerText;
        let output = form.querySelector( '.HB__form_output' );

        // Display pending state to user.
        button.disabled = true;
        button_label.innerText = '[busy]';
        let p = document.createElement( "p" );
        p.classList.add( 'alert' );
        p.classList.add( 'HB__form-popout' );
        p.innerText = "Connecting...";
        output.appendChild( p );
        output.style.display = 'flex';




        css_transition( output, 'opacity', '1' );
        css_transition( p, 'opacity', '1' );




        // Grab `FormData` then convert to plain obj, then to json string.
        const form_data = new FormData( form );
        const plain_obj_data = Object.fromEntries( form_data.entries() );
        const json_string_data = JSON.stringify( plain_obj_data );

        // Fetch params.
        const url = wp.rest_url;
        const fetch_options = {
            method: "POST",
            headers: {
                "X-WP-Nonce"    : wp.rest_nonce,
                "Content-Type"  : "application/json",
                "Accept"        : "application/json"
            },
            body: json_string_data,
        };

        // Do fetch request.
        result = await fetch_http_request( url, fetch_options );
        result.class = ( result.ok ) ? 'success' : 'danger';


        let node_list = output.childNodes;
        let children = [ ...node_list ];
        let hide_popouts = [];
        children.forEach( function( popout ){
            hide_popouts.push( css_transition( popout, 'opacity', '0' ) );
        } );
        await Promise.all( hide_popouts );
        remove_all_child_nodes( output );

        // Build result output and insert into dom.
        //let div = document.createElement( 'div' );


        const show_response_popouts = [];
        for ( const message in result.output ) {
            let p = document.createElement( 'p' );
            p.innerText = make_human_readable( result.output[ message ] );
            p.classList.add( 'alert' );
            p.classList.add( 'alert-' + result.class );
            p.classList.add( 'HB__form-popout' );
            //div.appendChild( p );
            output.appendChild( p );
            show_response_popouts.push( css_transition( p, 'opacity', '1' ) );
        }
        await Promise.all( show_response_popouts );

        let hide_response_popouts = [];
        for ( const popout in output.childNodes ) {
            hide_response_popouts.push( css_transition( popout, 'opacity', '0' ) );
        }
        await Promise.all( hide_response_popouts );

        remove_all_child_nodes( output );
        output.style.display = 'none';
        button_label.innerText = button_idle_text;
        button.disabled = false;

    };


    /**
     * Perform a Fetch request with timeout and json response.
     * 
     * Timeouts:
     *     6s for webserver to SMTP server.
     *     8s for SMTP send response to webserver.
     *     14s for front end as fallback in lieu of server response.
     * 
     * controller - abort controller to abort fetch request.
     * abort - abort wrapped in a timer.
     * signal: controller.signal - attach timeout to fetch request.
     * clearTimeout( timeoutId ) - cancel the timer on response.
     * 
     * @param {string} url      The WP plugin REST endpoint url.
     * @param {object} options  An object of fetch API options.
     * @return {object}         An object of message strings and ok flag.
     * 
     */
    async function fetch_http_request( url, options ) {

        const controller = new AbortController();
        const abort = setTimeout( () => controller.abort(), 14000 );

        try {
            const response = await fetch( url, {
                ...options,
                signal: controller.signal
            } );
            clearTimeout( abort );

            // parse response body as JSON.
            const result = await response.json();
            result.ok = response.ok;
            if ( typeof result.output === 'string' ) result.output = [ result.output ];
            if ( ! result.ok ) throw result;
            return result;

        } catch ( error ) {

            if ( ! error.output ) {
                // error is not a server response.
                error.output = [ 'Failed to establish a connection to the server.' ];
                error.ok = false;
            }
            for ( const message in error.output ) {
                console.error( make_human_readable( error.output[ message ] ) );
            }
            return error;
        }
    }


    /**
     * Clean strings for human output.
     * 
     * This function uses regex patterns to clean strings in 3 stages:
     * 
     * 1) Remove all html tags not inside brackets ()
     *      (?<!\([^)]*?) - do not match if preceeded by a '('
     *      <[^>]*?> - match all <>
     * 2) Remove anything that is not:
     *      (\([^\)]*?\)) - content enclosed in ()
     *      ' '   - spaces
     *      \p{L} - letters
     *      \p{N} - numbers
     *      \p{M} - marks (accents etc)
     *      \p{P} - punctuation
     * 3) Trim and replace multiple spaces with a single space.
     * 
     * @link https://www.regular-expressions.info/unicode.html#category
     * @param {string} string The dirty string.
     * @returns The cleaned string.
     */
    function make_human_readable( string ) {
        const tags = /(?<!\([^)]*?)<[^>]*?>/g;
        const human_readable = /(\([^\)]*?\))|[ \p{L}\p{N}\p{M}\p{P}]/ug;
        const bad_whitespaces = /^\s*|\s(?=\s)|\s*$/g;
        let notags = string.replace( tags, '' );
        let notags_human = notags.match( human_readable ).join('');
        let notags_human_clean = notags_human.replace( bad_whitespaces, '' );
        return notags_human_clean;
    }


    /**
     * Remove all child nodes from a dom node.
     * 
     */
    function remove_all_child_nodes( parent ) {
        while ( parent.firstChild ) {
            parent.removeChild( parent.firstChild );
        }
    }


    /**
     * Perform a CSS transition with a callback on completion.
     * 
     * @link https://gist.github.com/davej/44e3bbec414ed4665220
     * 
     */
    function css_transition( element, property, value ) {
        return new Promise( resolve => {
            element.style[ property ] = value;
            const resolve_and_cleanup = e => {
                if ( e.propertyName !== property ) return;
                element.removeEventListener( 'transitionend', resolve_and_cleanup );
                resolve();
            }
            element.addEventListener( 'transitionend', resolve_and_cleanup );
        } );
    }


    /**
     * Helper function to async pause.
     */
    function pause( ms ) { 
        return new Promise( resolve => { 
            setTimeout( () => {
                resolve();
            }, ms )
        } );
    }


    /**
     * Popout an alert element for a set time.
     * 
     * This 'popout' requires no human interaction unlike a popup.
     * Assumes the element has the following css properties:
     * 
     * opacity: 0;
     * transition: opacity {n}s ...;
     * 
     * @param {object} element The dom element to popout.
     * @param {integer} duration The duration of the popout in milliseconds.
     * 
     */
    async function popout_alert( element, ms ) {
        await css_transition( element, 'opacity', '1' );
        await pause( ms );
        await css_transition( element, 'opacity', '0' );
    }


    /**
     * Fire form_init() on 'doc ready'.
     * 
     */
    let interval = setInterval( function() {
        if ( document.readyState === 'complete' ) {
            clearInterval( interval );
            form_init();
        }
    }, 100);

})();
