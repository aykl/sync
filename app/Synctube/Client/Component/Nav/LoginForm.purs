module Synctube.Client.Component.Nav.LoginForm (loginForm) where

import Prelude

import Global (encodeURIComponent)

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { redirect :: String
  , loginDomain :: String
  , baseUrl :: String
  , csrfToken :: String
  }


loginForm :: State -> ReactElement
loginForm state =
  R.div'
    [ R.div [ RP.className "visible-lg" ]
            [ form state ]
    , R.div [ RP.className "visible-md" ]
            [ loginRegisterLinks state ]
    ]


form :: State -> ReactElement
form state =
  R.form  [ RP._id "loginform", RP.className "navbar-form navbar-right"
          , RP.action $ state.loginDomain <> "/login"
          , RP.method "post"
          ]
          [ I.hidden [ RP.name "_csrf" ] state.csrfToken
          , I.hidden [ RP.name "dest" ] $ state.baseUrl <> state.redirect
          , R.div [ RP.className "form-group" ]
              [ I.text' [ RP._id "username", RP.className "form-control"
                        , RP.name "name", RP.placeholder "Username" ]
              ]
          , R.div [ RP.className "form-group" ]
              [ I.password' [ RP._id "password", RP.className "form-control"
                            , RP.name "password", RP.placeholder "Password" ]
              ]
          , R.div [ RP.className "form-group" ]
              [ R.div [ RP.className "checkbox" ]
                  [ R.label'
                      [ R.input
                          [ RP._type "checkbox"
                          , RP.name "remember"
                          ] []
                      , R.span [ RP.className "navbar-text-nofloat" ]
                          [ R.text "Remember me" ]
                      ]
                  ]
              ]
          , R.button  [ RP._id "login", RP.className "btn btn-default"
                      , RP._type "submit"
                      ]
                      [ R.text "Login" ]
          ]


loginRegisterLinks :: State -> ReactElement
loginRegisterLinks state =
  R.p [ RP._id "loginform", RP.className "navbar-text pull-right"]
      [ R.a [ RP._id "login", RP.className "navbar-link", RP.href loginUrl ]
            [ R.text "Log in" ]
      , R.span' [ R.text " · " ]
      , R.a [ RP._id "register", RP.className "navbar-link"
            , RP.href "/register"
            ]
            [ R.text "Register" ]
      ]

  where

  loginUrl :: String
  loginUrl =
    let dest = encodeURIComponent $ state.baseUrl <> state.redirect in
    state.loginDomain <> "/login?dest=" <> dest
