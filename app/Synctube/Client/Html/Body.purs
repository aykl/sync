module Synctube.Client.Html.Body (BodyData, body) where

import Prelude

import Data.Tuple.Nested ((/\))
import Data.TemplateString ((<^>))

import Synctube.Client.App as App
import Synctube.Client.Page as Page
import Synctube.Client.Nav as Nav

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import ReactDOM as RD


type BodyData =
  { page :: Page.Page
  , nav :: Nav.State
  }


body :: BodyData -> ReactElement
body bodyData =
  R.body  [ RP.dangerouslySetInnerHTML { __html: bodyString } ]
          [ {-- can't put anything here, append to bodyString instead --} ]

  where

  bodyString = appString

  -- Since the whole page is rendered as static markup
  -- we should render actual app separately to add react attributes
  appString = RD.renderToString app

  app = App.view $ App.init bodyData.page bodyData.nav
