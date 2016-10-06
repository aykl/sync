module Synctube.Client.Nav (State, view) where

import Prelude

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP

import Synctube.Client.Page (Page(..))


-- Login page
-- Generic (PATH="/login",
--          LOGINLOGOUT=if loggedIn then +navlogoutform("/"))

-- Logout page
-- Generic (PATH="/logout",
--          LOGINLOGOUT=+navloginform("/"))

-- Privacy policy page
-- Generic (PATH="/policies/privacy")

-- Register page
-- Generic (PATH="/register",
--          LOGINLOGOUT=if loggedIn then +navlogoutform("/register"))



-- Generic page
-- nav.navbar.navbar-inverse.navbar-fixed-top(role="navigation")
--   include nav
--   +navheader()
--   #nav-collapsible.collapse.navbar-collapse
--     ul.nav.navbar-nav
--       +navdefaultlinks("/" + PATH)
--       +ADDITIONAL
--     LOGINLOGOUT || +navloginlogout("/" + PATH)

type State =
  { csrfToken :: String
  , baseUrl :: String
  , loginDomain :: String
  , loggedIn :: Boolean
  , loginName :: String
  , superAdmin :: Boolean
  }


view :: Page -> State -> String -> ReactElement
view page state siteTitle =
  R.nav
    [ RP.className "navbar navbar-inverse navbar-fixed-top"
    , RP.role "navigation"
    ]
    [ header siteTitle
    , controls page state
    ]


controls :: Page -> State -> ReactElement
controls page state =
  R.div
    [ RP._id "nav-collapsible"
    , RP.className "collapse navbar-collapse"
    ]
    [ navLinks page state
    , navLoginLogout state "/"
    ]


type NavLink =
  { path :: String
  , name :: String }


links'' :: Array NavLink
links'' = [ { path: "/", name: "Home" } ]


navLink :: String -> String -> Boolean -> ReactElement
navLink page title active | active =
  R.li [ RP.className "active" ]
    [ R.a [ RP.href page ] [ R.text title ] ]

navLink page title active =
  R.li []
    [ R.a [ RP.href page ] [ R.text title ] ]


header :: String -> ReactElement
header siteTitle =
  R.div [ RP.className "navbar-header" ]
    [ R.button
        [ RP.className "navbar-toggle"
        , RP._type "button"
        , RP._data {"toggle": "collapse", "target": "#nav-collapsible"}
        ]
        [ R.span [ RP.className "icon-bar" ] []
        , R.span [ RP.className "icon-bar" ] []
        , R.span [ RP.className "icon-bar" ] []
        ]
      , R.a
          [ RP.className "navbar-brand"
          , RP.href "/"
          ]
          [ R.text siteTitle ]
    ]

navLinks :: Page -> State -> ReactElement
navLinks page state =
  R.ul [ RP.className "nav navbar-nav" ] $
    (navDefaultLinks state "/") <> (pageSpecificLinks page state)


pageSpecificLinks :: Page -> State -> Array ReactElement
pageSpecificLinks (Index _) state =
  [ navSuperAdmin state false ]

pageSpecificLinks (Acp _) _ =
  [ R.li [ RP._id "nav-acp-section", RP.className "dropdown" ]
      [ R.a []
          []
      , R.ul [ RP.className "dropdown-menu" ] []
      ]
  ]

pageSpecificLinks (Channel _) state =
  [ R.li []
      [ R.a
          [ RP.href "javascript:void(0)"
          , RP.unsafeMkProps "onclick" "javascript:showUserOptions()"
          ]
          [ R.text "Options" ]
      ]
  , R.li []
      [ R.a
          [ RP._id "showchansettings"
          , RP.href "javascript:void(0)"
          , RP.unsafeMkProps "onclick" "javascript:showChannelSettings()"
          ]
          [ R.text "Channel Settings" ]
      ]
  , R.li [ RP.className "dropdown" ]
      [ R.a
          [ RP.className "dropdown-toggle"
          , RP.href "#"
          , RP._data {"toggle": "dropdown"}
          ]
          [ R.text "Layout"
          , R.b [ RP.className "caret" ] []
          ]
      , R.ul [ RP.className "dropdown-menu" ]
          [ R.li []
              [ R.a
                  [ RP.href "#"
                  , RP.unsafeMkProps "onclick" "javascript:chatOnly()"
                  ]
                  [ R.text "Chat Only" ]
              ]
          , R.li []
              [ R.a
                  [ RP.href "#"
                  , RP.unsafeMkProps "onclick" "javascript:removeVideo(event)"
                  ]
                  [ R.text "Remove Video" ]
              ]
          ]
      ]
  , navSuperAdmin state true
  ]

pageSpecificLinks _ _ =
  []


navDefaultLinks :: State -> String -> Array ReactElement
navDefaultLinks state page =
  (map (\l -> navLink l.path l.name $ l.path == page) links'') <> [
    R.li
      [ RP.className "dropdown" ]
      [ R.a
          [ RP.className "dropdown-toggle"
          , RP.href "#"
          , RP._data {"toggle": "dropdown"}
          ]
          [ R.text "Account"
          , R.b [ RP.className "caret" ] []
          ]
      , accountLinks state
      ]
  ]


accountLinks :: State -> ReactElement
accountLinks state | state.loggedIn =
  R.ul [ RP.className "dropdown-menu" ]
    [
      R.li []
        [ R.a [ RP.href "javascript:$('#logoutform').submit();" ]
            [ R.text "Log out" ]
        ]
    , R.li [ RP.className "divider" ] []
    , R.li []
        [ R.a [ RP.href $ state.loginDomain <> "/account/channels" ]
            [ R.text "Channels" ]
        ]
    , R.li []
        [ R.a [ RP.href $ state.loginDomain <> "/account/profile" ]
            [ R.text "Profile" ]
        ]
    , R.li []
        [ R.a [ RP.href $ state.loginDomain <> "/account/edit" ]
            [ R.text "Change Password/Email" ]
        ]
    ]

accountLinks state =
  R.ul [ RP.className "dropdown-menu" ]
    [
      R.li []
        [ R.a [ RP.href $ state.loginDomain <> "/login?dest=" <> "encodeURIComponent(baseUrl + page)" ]
            [ R.text "Login" ]
        ]
    , R.li []
        [ R.a [ RP.href $ state.loginDomain <> "/register" ]
            [ R.text "Register" ]
        ]
    ]


navSuperAdmin :: State -> Boolean -> ReactElement
navSuperAdmin state newTab | state.superAdmin && newTab =
  R.li []
    [ R.a
        [ RP.href "/acp"
        , RP.target "_blank"
        ]
        [ R.text "ACP" ]
    ]

navSuperAdmin state newTab | state.superAdmin =
  R.li []
    [ R.a [ RP.href "/acp" ] [ R.text "ACP" ] ]

navSuperAdmin _ _ =
  R.text ""


navLoginLogout :: State -> String -> ReactElement
navLoginLogout state redirectUrl | state.loggedIn =
  logoutForm state redirectUrl

navLoginLogout state redirectUrl =
  loginForm state redirectUrl


loginForm :: State -> String -> ReactElement
loginForm state redirect =
  R.div []
    [ R.div [ RP.className "visible-lg" ]
        [ R.form
            [ RP._id "loginform"
            , RP.className "navbar-form navbar-right"
            , RP.action $ state.loginDomain <> "/login"
            , RP.method "post"
            ]
            [ R.input
                [ RP._type "hidden"
                , RP.name "_csrf"
                , RP.value state.csrfToken
                ] []
            , R.input
                [ RP._type "hidden"
                , RP.name "dest"
                , RP.value $ state.baseUrl <> redirect
                ] []
            , R.div [ RP.className "form-group" ]
                [ R.input
                    [ RP._id "username"
                    , RP.className "form-control"
                    , RP._type "text"
                    , RP.name "name"
                    , RP.placeholder "Username"
                    ] []
                ]
            , R.div [ RP.className "form-group" ]
                [ R.input
                    [ RP._id "password"
                    , RP.className "form-control"
                    , RP._type "password"
                    , RP.name "password"
                    , RP.placeholder "Password"
                    ] []
                ]
            , R.div [ RP.className "form-group" ]
                [ R.div [ RP.className "checkbox" ]
                    [ R.label []
                        [ R.input
                            [ RP._type "checkbox"
                            , RP.name "remember"
                            ] []
                        , R.span [ RP.className "navbar-text-nofloat" ]
                            [ R.text "Remember me" ]
                        ]
                    ]
                ]
            , R.button
                [ RP._id "login"
                , RP.className "btn btn-default"
                , RP._type "submit"
                ]
                [ R.text "Login" ]
            ]
        ]
    , R.div [ RP.className "visible-md" ]
        [ R.p
            [ RP._id "loginform"
            , RP.className "navbar-text pull-right"
            ]
            [ R.a
                [ RP._id "login"
                , RP.className "navbar-link"
                , RP.href $ state.loginDomain <> "/login?dest=" <> "encodeURIComponent(baseUrl+redirect))"
                ]
                [ R.text "Log in" ]
            , R.span []
                [ R.text " · " ]
            , R.a
                [ RP._id "register"
                , RP.className "navbar-link"
                , RP.href "/register"
                ]
                [ R.text "Register" ]
            ]
        ]
    ]


logoutForm :: State -> String -> ReactElement
logoutForm state redirect =
  R.form
    [ RP._id "logoutform"
    , RP.className "navbar-text pull-right"
    , RP.action "/logout"
    , RP.method "post"
    ]
    [ R.input
        [ RP._type "hidden"
        , RP.name "dest"
        , RP.value $ state.baseUrl <> redirect ]
        []
    , R.input
        [ RP._type "hidden"
        , RP.name "_csrf"
        , RP.value state.csrfToken ]
        []
    , R.span [ RP._id "welcome" ]
        [ R.text $ "Welcome, " <> state.loginName ]
    , R.span []
        [ R.text " · " ]
    , R.input
        [ RP._id "logout"
        , RP.className "navbar-link"
        , RP._type "submit"
        , RP.value "Log out" ]
        []
    ]
