module Main where

import Prelude

import ReactDOM as RD

import Synctube.Client.App as App
import Synctube.Client.Page as Page
import Synctube.Client.Nav as Nav


renderApp :: Page.Page -> Nav.State -> String
renderApp page nav =
  let appData = App.init page nav in
  RD.renderToString $ App.view appData
