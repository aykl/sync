module Synctube.Client.Html.Document where

import Prelude

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import ReactDOM as RD

import Synctube.Client.Html.Head as Head
import Synctube.Client.Html.Body as Body


type DocumentData =
  { head :: Head.HeadData
  , body :: Body.BodyData
  }


renderDocument :: DocumentData -> String
renderDocument document =
  doctype <> (RD.renderToStaticMarkup $ createDocument document)

  where

  doctype :: String
  doctype = "<!DOCTYPE html>"


createDocument :: DocumentData -> ReactElement
createDocument document =
  R.html  [ RP.lang "en" ]
          [ Head.head document.head
          , Body.body document.body
          ]
