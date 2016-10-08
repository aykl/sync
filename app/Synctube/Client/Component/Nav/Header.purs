module Synctube.Client.Component.Nav.Header (header) where

import Prelude

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


-- Main navbar component that is visible at any page size
header :: String -> ReactElement
header siteTitle =
  R.div [ RP.className "navbar-header" ]
        [ collapsibleMenu
        , logoLink siteTitle
        ]


-- Collapsible menu that becomes visible at low page widths
collapsibleMenu :: ReactElement
collapsibleMenu =
  R.button  [ RP.className "navbar-toggle"
            , RP._type "button"
            , RP._data  { "toggle": "collapse"
                        , "target": "#nav-collapsible"
                        }
            ]
            [ R.span [ RP.className "icon-bar" ] []
            , R.span [ RP.className "icon-bar" ] []
            , R.span [ RP.className "icon-bar" ] []
            ]


-- Site logo and/or title that serves as "go to index" button
logoLink :: String -> ReactElement
logoLink siteTitle =
  R.a [ RP.className "navbar-brand" , RP.href "/" ]
      [ R.text siteTitle ]
