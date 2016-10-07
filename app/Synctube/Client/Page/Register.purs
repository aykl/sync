module Synctube.Client.Page.Register where

import Prelude

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { registrationStatus :: RegistrationStatus
  , csrfToken :: String
  }


data RegistrationStatus
  = LoggedIn
  | NotRegistered (Maybe String)
  | RegistrationSuccess String


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
    [ content state ]


scripts :: Array ReactElement
scripts =
  [ R.script [ RP.src "/js/jquery.js"] []
  , R.script
      [ RP._type "text/javascript"
      , RP.dangerouslySetInnerHTML { __html: scriptBody }
      ]
      []
  ]

  where

  scriptBody =
    """function verify() {
      var valid = checkUsername();
      valid = checkPasswords() && valid;
      return valid;
    }
    function checkUsername() {
      var name = $("#username").val();
      $("#usernameerror").remove();
      if (name === "") {
        $("#username").parent().addClass("has-error");
        $("<p/>").addClass("text-danger")
          .attr("id", "usernameerror")
          .text("Username must not be empty")
          .insertAfter($("#username"));
        return false;
      } else if (!(/^[-\w\u00c0-\u00ff]{1,20}$/).test(name)) {
        $("#username").parent().addClass("has-error");
        $("<p/>").addClass("text-danger")
          .attr("id", "usernameerror")
          .text("Username must consist of 1-20 characters a-Z, A-Z, 0-9 " +
                ", -, or _.")
          .insertAfter($("#username"));
        return false;
      } else {
        $("#username").parent().removeClass("has-error")
          .addClass("has-success");
      }
    }
    function checkPasswords() {
      var pw = $("#password").val();
      var pwc = $("#password_confirm").val();
      $("#passwordempty").remove();
      $("#passwordmismatch").remove();
      if (pw === "") {
        $("#password").parent().addClass("has-error");
        $("<p/>").addClass("text-danger")
          .attr("id", "passwordempty")
          .text("Password must not be empty")
          .insertAfter($("#password"));
        return false;
      } else {
        $("#password").parent().removeClass("has-error")
          .addClass("has-success");
        if (pw !== pwc) {
          $("#password_confirm").parent().addClass("has-error");
          $("<p/>").addClass("text-danger")
            .attr("id", "passwordmismatch")
            .text("Passwords do not match")
            .insertAfter($("#password_confirm"));
          return false;
        } else {
          $("#password_confirm").parent().removeClass("has-error")
            .addClass("has-success");
        }
      }
    }
    document.querySelector("._tempClass_registerForm")
      .onsubmit = function () { return verify(); };
    document.querySelector("._tempClass_registerForm_password")
        .onkeyup = checkPasswords;
    document.querySelector("._tempClass_registerForm_confirmPassword")
      .onkeyup = checkPasswords;"""


content :: State -> ReactElement
content state@{ registrationStatus: LoggedIn } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
    [ R.div [ RP.className "alert alert-danger messagebox center" ]
        [ R.strong [] [ R.text "Already logged in" ]
        , R.p []
            [ R.text $
                "You are already logged in.  If you intend to register \
                \a new account, please "
            , R.a [ RP.href "/logout?redirect=/register" ]
                [ R.text "Logout" ]
            , R.text " first."
            ]
        --, TODO Link to My Account page
        ]
    ]

content state@{ registrationStatus: NotRegistered error } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
    [ registrationError error
    , R.h2 [] [ R.text "Register" ]
    , R.form
        [ RP.role "form", RP.action "/register", RP.method "post"
        , RP.className "_tempClass_registerForm"
        ]
        [ R.input [ RP._type "hidden", RP.name "_csrf"
                  , RP.value state.csrfToken ] []
        , R.div [ RP.className "form-group" ]
            [ R.label [ RP.className "control-label", RP.htmlFor "username" ]
                [ R.text "Username" ]
            , R.input
                [ RP._id "username", RP.className "form-control"
                , RP._type "text", RP.name "name"
                ] []
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label"
                , RP.htmlFor "password"
                ]
                [ R.text "Password" ]
            , R.input
                [ RP._id "password"
                , RP.className "form-control _tempClass_registerForm_password"
                , RP._type "password"
                , RP.name "password"
                ] []
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label"
                , RP.htmlFor "password_confirm"
                ]
                [ R.text "Confirm Password" ]
            , R.input
                [ RP._id "password_confirm"
                , RP.className "form-control _tempClass_registerForm_confirmPassword"
                , RP._type "password"
                ] []
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label"
                , RP.htmlFor "email"
                ]
                [ R.text "Email (optional)" ]
            , R.input
                [ RP._id "email"
                , RP.className "form-control"
                , RP._type "email"
                , RP.name "email"
                ] []
            , R.p []
                [ R.text $
                    "Providing an email address is optional and will \
                    \allow you to recover your account via email if you \
                    \forget your password.  Your address will not be \
                    \shared with anyone."
                ]
            ]
        , R.button
            [ RP._id "register"
            , RP.className "btn btn btn-success btn-block"
            , RP._type "submit"
            ]
            [ R.text "Register" ]
        ]
    ]

  where

  registrationError :: Maybe String -> ReactElement
  registrationError (Just error) =
    R.div [ RP.className "alert alert-danger messagebox center" ]
      [ R.strong [] [ R.text "Registration Failed" ]
      , R.p [] [ R.text error ]
      ]

  registrationError Nothing =
    R.text ""

content state@{ registrationStatus: RegistrationSuccess userName } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
    [ R.div [ RP.className "alert alert-success messagebox center" ]
        [ R.strong [] [ R.text "Registration Successful" ]
        , R.p []
            [ R.text $
                "Thanks for registering, " <> userName <> "!  Now you can "
            , R.a [ RP.href "/login" ]
                [ R.text "Login" ]
            , R.text " to use your account."
            ]
        ]
    ]
