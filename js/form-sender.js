/**
 * Herringbone Contact Form js.
 *
 * This js handles the front end form submission using ajax.
 *
 * @package Herringbone
 * @subpackage HB_Contact_Form
 * @author Jefferson Real <me@jeffersonreal.com>
 * @copyright Copyright (c) 2021, Jefferson Real
 * @license GPL2+
 * 
 * wp_localize_hb_contact_form_vars (declared in html body)
 * .rest_url;
 * .rest_nonce;
 * .ajax_url;
 * .admin_email;
 * .nonce;
 * .action;
 * 
 */
(function form_sender() {

    // grab wp localize vars
    wp = wp_localize_hb_contact_form_vars;

    /**
     * Hold the form DOM node that was submitted so the same
     * form can be updated with response data.
     * 
     */
    let current_form;

    /**
     * Prepare the form ready for input.
     * 
     */
    function form_init() {

        // Hide the honeypot input field(s)
        let honeypot = document.querySelectorAll( '.jsSaveTheBees' );
        honeypot.forEach( input => { input.style.display = "none" } )

        // Attach submit listener callback to the form(s)
        document.querySelectorAll( '.jsFormSubmit' ).forEach( form => {
            form.addEventListener( 'submit', handle_form_submit );
        } );
    };


    /**
     * Handle the submitted form.
     * 
     * @param {SubmitEvent} event
     * 
     */
    async function handle_form_submit( event ) {

        // prevent normal submit action
        event.preventDefault();

        // get the element the event handler was attached to.
        const form = event.currentTarget

        // if honeypot has a value ( bye bye bot )
        if ( '' != form.querySelector( '[name="required_field"]' ).value ) {
            document.documentElement.remove();
            window.location.replace("https://en.wikipedia.org/wiki/Robot");
        }

        // Update button
        form.querySelector( '.jsButtonSubmit' ).disabled = true;
        form.querySelector( '.jsButtonSubmit > *:first-child' ).textContent = 'One mo...';

        try {

            // Capture form fields from a `FormData` instance.
            const form_data = new FormData( form );

            // Add nonce and action properties to the form data
            form_data.set( 'nonce', wp.wp_nonce );
            form_data.set( 'action', wp.wp_action );

            // scrap honeypot
            form_data.delete( 'required_field' );

            // Call and await `post_form_data_as_json()` with the FormData instance
            const response_data = await post_form_data_as_json( form_data );

            // Handle the response
            console.log( { response_data } );

        } catch ( error ) {
            console.error( error );
        }
    }


    /**
     * POST data as JSON with fetch.
     *
     * @param {string}  url       - URL to POST data to
     * @param {data}    form_data - FormData instance
     * @return {Object}           - Response body from URL that was POSTed to
     * 
     */
    async function post_form_data_as_json( form_data ) {

        // transform the form data key-value pairs into an object
        const plain_obj_data = Object.fromEntries( form_data.entries() );
        // transform that object into a json string
        const json_string_data = JSON.stringify( plain_obj_data );

console.log(json_string_data);

        const fetch_options = {
            method: "POST",
            headers: {
                "X-WP-Nonce"    : wp.rest_nonce,
                "Content-Type"  : "application/json",
                "Accept"        : "application/json"
            },
            body: json_string_data,
        };

        // wp ajax api url
        const url = wp.rest_url + 'Jefferson/HB_Contact_Form/post';

        const response = await fetch( url, fetch_options );

        if ( !response.ok ) {
            const error_message = await response.text();
            throw new Error( error_message );
        }
        //return to caller handle_form_submit
        return response.json();
    }


    /**
     * Do this on successful ajax response.
     * 
     * @param {json} data The json response sent by the server.
     * 
     */
    function server_response( data ) {

        form = current_form;

        // Get the elems of the form that was used
        let output = form.querySelector( '.jsOutput' );
        let hidden_form = form.querySelector( '.jsHideForm' );
        let button = form.querySelector( '.jsButtonSubmit > *:first-child' );

console.log(data);

        // Check json ajax response
/*        if ( data.result == 'success' ) {

            // Output message

            output.append( '<p>Message Delivered!</p>' );
            output.style.display = 'block';
            button.textContent = '👍';

        } else if ( data.result == 'settings_missing' ) {

            output.append( '<p>SMTP settings are incomplete. Please alert website admin.</p>' );
            output.style.display = 'block';
            button.textContent = 'Error';

        } else if ( data.result == 'settings_invalid' ) {

            output.append( '<p>SMTP settings are invalid. Please alert website admin.</p>' );
            output.style.display = 'block';
            button.textContent = 'Error';

        } else {

            data.errors.forEach( (error, message) => output.append( '<p>' + error + ': ' + message + '</p>' ) );
            output.style.display = 'block';
            button.textContent = 'Error';
        }
*/
        // re-enable button
        button.disabled = false;
    }//server_response end


    /**
     * Do this on server connection failure
     * 
     * @param {object} error An error object return by fetch.
     * 
     */
    function http_error( error ) {

        let form = current_form;

        let email = wp.wp_admin_email;

        let message = '<p class="alert">Error: ' + error.message + '</p>';
        let fallback  = '<p>Sincere apologies, something went wrong.</p>';
            fallback += '<p>Please <a href="mailto:' + email + '">click ';
            fallback += 'here</a> to send a message using the email app on your device.</p>';

        let output = form.querySelector( '.jsOutput' );
        output.innerHTML = message;
        output.innerHTML += fallback;
        output.style.display = 'block';

        let button = form.querySelector( '.jsButtonSubmit > *:first-child' );
        button.textContent = 'Error';

        // If logged in, dump to console
        if ( document.body.classList.contains( 'logged-in' ) ) {
            console.log( 'Form input error! Error message will follow if captured...' );
            console.log( error.message );
        }
        // re-enable button
        button.disabled = false;
    }//http_error end


    /**
     * Fire the init function on 'doc ready'.
     * 
     */
    var interval = setInterval( function() {
        if(document.readyState === 'complete') {
            clearInterval( interval );
            /* Start the reactor */
            form_init();
        }
    }, 100);


})();
