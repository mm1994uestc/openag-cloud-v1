// load the 'local authentication' strategy (not using FB or Google).
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/user');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the local session
    passport.serializeUser( function( user, done) {
        console.log('passport serialize');
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser( function( id, done) {
        // This gets called right before we redirect to the /home page.
        // It ALSO gets called when we logout.  How can we tell the diff?
        console.log('passport deserialize');

        // The second arg (true) means get env var data.  
        // This is the only place we want to query for env vars.
        User.findById(id, true, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, 
        // we will override with email
        usernameField : 'email',
        passwordField : 'password',
        // allows us to pass in the req from our route 
        // (lets us check if a user is logged in or not)
        passReqToCallback : true 
    },
    function( req, email, password, done ) {
        if( email ) {
            // Use lower-case e-mails to avoid case-sensitive e-mail matching
            email = email.toLowerCase(); 
        }

        // asynchronous
        process.nextTick( function() {
            console.log('passport login');
            User.findById( email, false, function( err, user ) {
                // if there are any errors, return the error
                if( err ) {
                    console.log('passport login error');
                    return done( err );
                }

                // if no user is found, return the message
                if( ! user ) {
                    console.log('passport login no user found');
                    return done( null, false, 
                        req.flash( 'loginMessage', 'No user found.' ));
                }

                if( ! user.validatePassword( password )) {
                    console.log('passport login invalid password');
                    return done( null, false, 
                        req.flash( 'loginMessage', 'Oops! Wrong password.'));
                } 

                // else, all is well, return user
                console.log('passport login success');
                return done( null, user );
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        // allows us to pass in the req from our route 
        // (lets us check if a user is logged in or not)
        passReqToCallback : true 
    },
    // access extra form fields by using req.body.<field>
    // 'done' is the callback function
    function(req, email,  password, done) {
        if( email ) {
            // Use lower-case e-mails to avoid case-sensitive e-mail matching
            email = email.toLowerCase(); 
        }

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                console.log('passport signup');
                User.findById( email, false, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 
                            'That email is already taken.'));
                    } else {

                        // create the user
                        var newUser      = new User();
                        newUser.id       = email;
                        newUser.username = req.body.username;
                        newUser.password = newUser.generateHash( password );

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }

                });
/*debugrob I don't think we ever hit this case, so removing for now
*/
            // if the user is logged in but has no local account...
            } else if ( !req.user.id ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account
                // is being used by another user
                User.findById( email, false, function(err, user) {
                    if (err)
                        console.log('passport login no local accnt error');
                        return done(err);
                    
                    if (user) {
                        console.log('passport login no local accnt email taken');
                        return done(null, false, req.flash('loginMessage', 
                            'That email is already taken.'));
                    } else {
                        var user = req.user;
                        user.id = email;
                        user.username = username;
                        user.password = user.generateHash( password );
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            console.log('passport login no local accnt success');
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. 
                // Ignore signup. (You should log out before trying to 
                // create a new account, user!)
                console.log('passport login user already logged in');
                return done(null, req.user);
            }
        });
    }));
};
