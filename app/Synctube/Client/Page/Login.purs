module Synctube.Client.Page.Login where

import Prelude

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { signInStatus :: SignInStatus
  , redirect :: Maybe String
  , csrfToken :: String
  }


data SignInStatus
  = WasAlreadyLoggedIn String
  | NotLoggedIn (Maybe String)
  | LoggedIn String


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
            [ content state ]


content :: State -> ReactElement
content state@{ signInStatus: WasAlreadyLoggedIn loginName } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ R.div [ RP.className "alert alert-info messagebox center" ]
                [ R.h3  [ RP.style {"margin": "5px auto"} ]
                        [ R.text $ "Logged in as " <> loginName ]
                ]
        ]

content state@{ signInStatus: NotLoggedIn loginError } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ showLoginError loginError
        , R.h2' [ R.text "Login" ]
        , loginForm
        ]

  where

  loginForm :: ReactElement
  loginForm =
    R.form  [ RP.role "form", RP.action "/login", RP.method "post" ]
            [ I.hidden [ RP.name "_csrf" ] state.csrfToken
            , redirectTo state.redirect
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.htmlFor "username" ] [ R.text "Username" ]
                    , I.text' [ RP._id "username", RP.className "form-control"
                              , RP.name "name" ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.htmlFor "password" ]
                              [ R.text "Password" ]
                    , I.password' [ RP._id "password"
                                  , RP.className "form-control"
                                  , RP.name "password" ]
                    , R.a [ RP.href "/account/passwordreset" ]
                          [ R.text"Forgot password?" ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.div [ RP.className "checkbox" ]
                            [ R.label'
                                [ R.input [ RP._type "checkbox"
                                          , RP.name "remember" ] []
                                , R.text "Remember me"
                                ]
                            ]
                    ]
            , R.button  [ RP.className "btn btn-success btn-block"
                        , RP._type "submit"
                        ]
                        [ R.text "Login" ]
            ]

  redirectTo :: Maybe String -> ReactElement
  redirectTo (Just url) =
    I.hidden [ RP.name "dest" ] url

  redirectTo Nothing =
    R.text ""


content state@{ signInStatus: LoggedIn loginName } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ R.div [ RP.className "alert alert-success messagebox center" ]
                [ R.strong' [ R.text "Login Successful" ]
                , R.p' $
                    [ R.text $ "Logged in as " <> loginName
                    ] <> redirectTo state.redirect
                ]
        ]

  where

  redirectTo :: Maybe String -> Array ReactElement
  redirectTo (Just url) =
    [ R.br' []
    , R.a [ RP.href url ] [ R.text "Return to previous page" ]
    ]

  redirectTo Nothing =
    []


showLoginError :: Maybe String -> ReactElement
showLoginError (Just error) =
  R.div [ RP.className "alert alert-danger messagebox center" ]
        [ R.strong' [ R.text "Login Failed" ]
        , R.p' [ R.text error ]
        ]

showLoginError Nothing =
  R.text ""
