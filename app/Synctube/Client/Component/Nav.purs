module Synctube.Client.Component.Nav (State, view) where

import Prelude

import Synctube.Client.Component.Nav.Header (header)
import Synctube.Client.Component.Nav.LoginForm (loginForm)

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I

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
    , scripts
    ]


controls :: Page -> State -> ReactElement
controls page state =
  R.div [ RP._id "nav-collapsible", RP.className "collapse navbar-collapse" ]
        [ navLinks page state
        , navLoginLogout state "/" ]


scripts :: ReactElement
scripts =
  R.script  [ RP._type "text/javascript"
            , RP.dangerouslySetInnerHTML { __html: scriptBody }
            ] []

  where

  scriptBody =
    """
    document.querySelectorAll("._tempClass_showUserOptions")
    .forEach(function (btn) {
      btn.addEventListener('click',
        function() {
          showUserOptions();
        });
    });
    document.querySelectorAll("._tempClass_chatOnly")
    .forEach(function (btn) {
      btn.addEventListener('click',
        function() {
          chatOnly();
        });
    });
    document.querySelectorAll("._tempClass_showChannelSettings")
    .forEach(function (btn) {
      btn.addEventListener('click',
        function() {
          showChannelSettings();
        });
    });
    document.querySelectorAll("._tempClass_removeVideo")
    .forEach(function (btn) {
      btn.addEventListener('click',
        function(e) {
          removeVideo(e);
        });
    });
    """


type NavLink =
  { path :: String
  , name :: String }


links'' :: Array NavLink
links'' = [ { path: "/", name: "Home" } ]


navLink :: String -> String -> Boolean -> ReactElement
navLink page title active | active =
  R.li  [ RP.className "active" ]
        [ R.a [ RP.href page ] [ R.text title ] ]

navLink page title active =
  R.li' [ R.a [ RP.href page ] [ R.text title ] ]


navLinks :: Page -> State -> ReactElement
navLinks page state =
  R.ul  [ RP.className "nav navbar-nav" ] $
        (navDefaultLinks state "/") <> (pageSpecificLinks page state)


pageSpecificLinks :: Page -> State -> Array ReactElement
pageSpecificLinks (Index _) state =
  [ navSuperAdmin state false ]

pageSpecificLinks (Acp _) _ =
  [ R.li [ RP._id "nav-acp-section", RP.className "dropdown" ]
      [ R.a' []
      , R.ul [ RP.className "dropdown-menu" ] []
      ]
  ]

pageSpecificLinks (Channel _) state =
  [ R.li'
      [ R.a [ RP.href "javascript:void(0)"
            , RP.className "_tempClass_showUserOptions"
            ]
            [ R.text "Options" ]
      ]
  , R.li'
      [ R.a [ RP._id "showchansettings"
            , RP.href "javascript:void(0)"
            , RP.className "_tempClass_showChannelSettings"
            ]
            [ R.text "Channel Settings" ]
      ]
  , R.li [ RP.className "dropdown" ]
      [ R.a [ RP.className "dropdown-toggle"
            , RP.href "#"
            , RP._data {"toggle": "dropdown"}
            ]
            [ R.text "Layout"
            , R.b [ RP.className "caret" ] []
            ]
      , R.ul [ RP.className "dropdown-menu" ]
          [ R.li'
              [ R.a [ RP.href "#"
                    , RP.className "_tempClass_chatOnly"
                    ]
                    [ R.text "Chat Only" ]
              ]
          , R.li'
              [ R.a [ RP.href "#"
                    , RP.className "_tempClass_removeVideo"
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
    R.li  [ RP.className "dropdown" ]
          [ R.a [ RP.className "dropdown-toggle"
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
      R.li'
        [ R.a [ RP.href "javascript:$('#logoutform').submit();" ]
              [ R.text "Log out" ]
        ]
    , R.li [ RP.className "divider" ] []
    , R.li'
        [ R.a [ RP.href $ state.loginDomain <> "/account/channels" ]
              [ R.text "Channels" ]
        ]
    , R.li'
        [ R.a [ RP.href $ state.loginDomain <> "/account/profile" ]
              [ R.text "Profile" ]
        ]
    , R.li'
        [ R.a [ RP.href $ state.loginDomain <> "/account/edit" ]
              [ R.text "Change Password/Email" ]
        ]
    ]

accountLinks state =
  R.ul [ RP.className "dropdown-menu" ]
    [ R.li'
        [ R.a [ RP.href $ state.loginDomain <> "/login?dest=" <> "encodeURIComponent(baseUrl + page)" ]
              [ R.text "Login" ]
        ]
    , R.li'
        [ R.a [ RP.href $ state.loginDomain <> "/register" ]
              [ R.text "Register" ]
        ]
    ]


navSuperAdmin :: State -> Boolean -> ReactElement
navSuperAdmin state newTab | state.superAdmin && newTab =
  R.li'
    [ R.a [ RP.href "/acp", RP.target "_blank" ]
          [ R.text "ACP" ]
    ]

navSuperAdmin state newTab | state.superAdmin =
  R.li' [ R.a [ RP.href "/acp" ] [ R.text "ACP" ] ]

navSuperAdmin _ _ =
  R.text ""


navLoginLogout :: State -> String -> ReactElement
navLoginLogout state redirectUrl | state.loggedIn =
  logoutForm state redirectUrl

navLoginLogout state@{ loginDomain, baseUrl, csrfToken } redirect =
  loginForm { redirect, loginDomain, baseUrl, csrfToken }


logoutForm :: State -> String -> ReactElement
logoutForm state redirect =
  R.form  [ RP._id "logoutform"
          , RP.className "navbar-text pull-right"
          , RP.action "/logout", RP.method "post"
          ]
          [ I.hidden [ RP.name "dest" ] $ state.baseUrl <> redirect
          , I.hidden [ RP.name "_csrf" ] $ state.csrfToken
          , R.span  [ RP._id "welcome" ]
                    [ R.text $ "Welcome, " <> state.loginName ]
          , R.span' [ R.text " · " ]
          , I.submit [ RP._id "logout", RP.className "navbar-link" ] "Log out"
          ]
