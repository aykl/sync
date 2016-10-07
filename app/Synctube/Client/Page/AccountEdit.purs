module Synctube.Client.Page.AccountEdit where

import Data.Maybe (Maybe(..))
import Data.Either (Either(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { loginName :: Maybe String
  , editResult :: Maybe (Either String String)
  , csrfToken :: String
  }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ content state ]
    ]


scripts :: Array ReactElement
scripts =
  [ R.script
      [ RP._type "text/javascript"
      , RP.dangerouslySetInnerHTML { __html: scriptBody }
      ]
      []
  ]

  where

  scriptBody =
    """function validatePasswordChange() {
      var pw = $("#newpassword").val();
      var pwc = $("#newpassword_confirm").val();
      $("#passwordempty").remove();
      $("#passwordmismatch").remove();

      if (pw === '') {
        $("#newpassword").parent().addClass("has-error");
        $("<p/>").addClass("text-danger")
          .attr("id", "passwordempty")
          .text("Password must not be empty")
          .insertAfter($("#newpassword"));
        return false;
      } else {
        if (pw !== pwc) {
          $("#newpassword_confirm").parent().addClass("has-error");
          $("#newpassword").parent().addClass("has-error");
          $("<p/>").addClass("text-danger")
            .attr("id", "passwordmismatch")
            .text("Passwords do not match")
            .insertAfter($("#newpassword_confirm"));
          return false;
        } else {
          $("#username").attr("disabled", false);
          return true;
        }
      }
    }
    function submitEmail() {
      $("#username2").attr("disabled", false);
      return true;
    }

    document.querySelector("._tempClass_changePasswordForm")
      .onsubmit = function () { return validatePasswordChange(); };
    document.querySelector("._tempClass_changeEmailForm")
      .onsubmit = function () { return submitEmail(); };"""


content :: State -> ReactElement
content state@{ loginName: Nothing } =
  R.div [ RP.className ".col-lg-6.col-lg-offset-3.col-md-6.col-md-offset-3" ]
    [ R.div [ RP.className "alert alert-danger messagebox center" ]
        [ R.strong [] [ R.text "Authorization Required" ]
        , R.p []
            [ R.text "You must be "
            , R.a [ RP.href "/login" ]
                [ R.text "logged in" ]
            , R.text " to view this page."
            ]
        ]
    ]

content state@{ loginName: Just loginName } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
    [ editResultMessage state.editResult
    , R.h3 [] [ R.text "Change Password" ]
    , changePasswordForm state.csrfToken loginName
    , R.hr [] []
    , R.h3 [] [ R.text "Change Email" ]
    , changeEmailForm state.csrfToken loginName
    ]


editResultMessage :: Maybe (Either String String) -> ReactElement
editResultMessage (Just (Left errorMessage)) =
  R.div [ RP.className "alert alert-danger center" ]
    [ R.p [] [ R.text errorMessage ] ]

editResultMessage (Just (Right successMessage)) =
  R.div [ RP.className "alert alert-success center" ]
    [ R.p [] [ R.text successMessage ] ]

editResultMessage Nothing =
  R.text ""


changePasswordForm :: String -> String -> ReactElement
changePasswordForm csrfToken loginName =
  R.form
    [ RP.action "/account/edit"
    , RP.method "post"
    , RP.className "_tempClass_changePasswordForm"
    ]
    [ R.input [ RP._type "hidden", RP.name "_csrf", RP.value csrfToken ]
        []
    , R.input
        [ RP._type "hidden"
        , RP.name "action"
        , RP.value "change_password"
        ] []
    , R.div [ RP.className "form-group" ]
        [ R.label
            [ RP.className "control-label", RP.htmlFor "username" ]
            [ R.text "Username" ]
        , R.input
            [ RP._id "username", RP.className "form-control"
            , RP._type "text", RP.name "name"
            , RP.value loginName, RP.disabled true
            ] []
        ]
    , R.div [ RP.className "form-group" ]
        [ R.label
            [ RP.className "control-label", RP.htmlFor "oldpassword" ]
            [ R.text "Current Password" ]
        , R.input
            [ RP._id "oldpassword", RP.className "form-control"
            , RP._type "password", RP.name "oldpassword"
            ] []
        ]
    , R.div [ RP.className "form-group" ]
        [ R.label
            [ RP.className "control-label", RP.htmlFor "newpassword" ]
            [ R.text "New Password" ]
        , R.input
            [ RP._id "newpassword", RP.className "form-control"
            , RP._type "password", RP.name "newpassword"
            ] []
        ]
    , R.div [ RP.className "form-group" ]
        [ R.label
            [ RP.className "control-label", RP.htmlFor "newpassword_confirm" ]
            [ R.text "Confirm New Password" ]
        , R.input
            [ RP._id "newpassword_confirm", RP.className "form-control"
            , RP._type "password", RP.name "newpassword_confirm"
            ] []
        ]
    , R.button
        [ RP._id "changepassbtn", RP.className "btn btn-danger btn-block"
        , RP._type "submit"
        ]
        [ R.text "Change Password" ]
    ]


changeEmailForm :: String -> String -> ReactElement
changeEmailForm csrfToken loginName =
  R.form
    [ RP.action "/account/edit", RP.method "post"
    , RP.className "_tempClass_changeEmailForm"
    ]
    [ R.input [ RP._type "hidden", RP.name "_csrf", RP.value csrfToken ]
        []
    , R.input [ RP._type "hidden", RP.name "action", RP.value "change_email" ]
        []
    , R.div [ RP.className "form-group" ]
        [ R.label [ RP.className "control-label", RP.htmlFor "username2" ]
            [ R.text "Username" ]
        , R.input
            [ RP._id "username2", RP.className "form-control"
            , RP._type "text", RP.name "name"
            , RP.value loginName
            , RP.disabled true
            ] []
        ]
    , R.div [ RP.className "form-group" ]
        [ R.label [ RP.className "control-label", RP.htmlFor "password2" ]
            [ R.text "Password" ]
        , R.input
            [ RP._id "password2", RP.className "form-control"
            , RP._type "password", RP.name "password"
            ] []
        ]
    , R.div [ RP.className "form-group" ]
        [ R.label [ RP.className "control-label", RP.htmlFor "email" ]
            [ R.text "New Email" ]
        , R.input
            [ RP.className "email form-control"
            , RP._type "email", RP.name "email"
            ] []
        ]
    , R.button
        [ RP._id "changeemailbtn"
        , RP.className "btn btn-danger btn-block"
        , RP._type "submit"
        ]
        [ R.text "Change Email" ]
    ]
