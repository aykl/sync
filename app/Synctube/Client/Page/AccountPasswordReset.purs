module Synctube.Client.Page.AccountPasswordReset where

import Prelude

import Data.Tuple.Nested ((/\))
import Data.TemplateString ((<^>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { reset :: Reset
  , csrfToken :: String
  }


data Reset
  = ResetSent String
  | ResetError String
  | NoReset


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ R.div
            [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
            [ R.h3' [ R.text "Reset Password" ]
            , resetStatus state.reset
            , passwordResetForm state.csrfToken
            ]
        ]
    ]


resetStatus :: Reset -> ReactElement
resetStatus (ResetSent email) =
  R.div [ RP.className "alert alert-success center messagebox" ]
        [ R.strong' [ R.text "Password reset request sent" ]
        , R.p'  [ R.text $
                    "Please check ${email} for your recovery link." <^>
                    [ "email" /\ email ]
                ]
        ]

resetStatus (ResetError error) =
  R.div [ RP.className "alert alert-danger center messagebox" ]
        [ R.strong' [ R.text "Error" ]
        , R.p' [ R.text error ]
        ]

resetStatus NoReset =
  R.text ""


passwordResetForm :: String -> ReactElement
passwordResetForm csrfToken =
  R.form  [ RP.action "/account/passwordreset", RP.method "post"
          , RP.role "form"
          ]
          [ I.hidden [ RP.name "_csrf" ] csrfToken
          , R.div [ RP.className "form-group" ]
                  [ R.label [ RP.className "control-label"
                            , RP.htmlFor "username"
                            ]
                            [ R.text "Username" ]
                  , I.text' [ RP._id "username", RP.className "form-control"
                            , RP.name "name" ]
                  ]
          , R.div [ RP.className "form-group" ]
                  [ R.label [ RP.className "control-label", RP.htmlFor "email" ]
                            [ R.text "Email address" ]
                  , I.email'  [ RP._id "email", RP.className "form-control"
                              , RP.name "email" ]
                  ]
          , R.button  [ RP.className "btn btn-primary btn-block"
                      , RP._type "submit"
                      ]
                      [ R.text "Send reset request" ]
          ]
