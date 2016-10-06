module Synctube.Client.Html.Head (HeadData, head) where

import Prelude

import Data.Tuple.Nested ((/\))
import Data.TemplateString ((<^>))

import Synctube.Client.Page as Page

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type HeadData =
  { description :: String
  , author :: String
  , title :: String
  , page :: Page.Page
  }


defaultTheme :: String
defaultTheme = "/css/themes/slate.css"


head :: HeadData -> ReactElement
head headData =
  R.head' $
    [ R.meta  [ RP.charSet "utf-8" ] []
    , R.meta  [ RP.name "viewport"
              , RP.content "width=device-width, initial-scale=1.0"
              ] []
    , R.meta  [ RP.name "description", RP.content headData.description ] []
    , R.meta  [ RP.name "author", RP.content headData.author ] []

    , R.title'  [ R.text headData.title ]
    , R.link  [ RP.href "/css/sticky-footer-navbar.css", RP.rel "stylesheet" ] []
    , R.link  [ RP.href "/css/cytube.css", RP.rel "stylesheet" ] []
    , R.link  [ RP._id "usertheme", RP.href defaultTheme, RP.rel "stylesheet" ] []

    , R.script  [ RP._type "text/javascript"
                , RP.dangerouslySetInnerHTML
                    { __html:
                        "var DEFAULT_THEME = '${DEFAULT_THEME}';"
                        <^> [ "DEFAULT_THEME" /\ defaultTheme ]
                    }
                ] []
    , R.script  [ RP.src "/js/theme.js" ] []
    ] <> pageStylesheets headData.page


pageStylesheets :: Page.Page -> Array ReactElement
pageStylesheets (Page.Acp _) =
  [ R.link  [ RP.rel "stylesheet", RP._type "text/css", RP.href "/css/acp.css" ]
            []
  ]

pageStylesheets (Page.Channel _) =
  [ R.link  [ RP.href "//code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css"
            , RP.rel "stylesheet"
            ] []
  , R.link  [ RP.rel "stylesheet", RP.href "/css/video-js.css" ] []
  ]

pageStylesheets _ = []
