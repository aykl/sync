module Synctube.Client.Component.Common.Input
  -- shorthands for React.DOM.input
  ( hidden, hidden', password, password', text, text', email, email'
  , submit, submit'
  )
where

import Prelude

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


input :: String -> Array RP.Props -> String -> ReactElement
input _type props value =
  let props' = props <> [ RP._type _type, RP.value value ] in
  R.input props' []


input' :: String -> Array RP.Props -> ReactElement
input' _type props =
  let props' = props <> [ RP._type _type ] in
  R.input props' []


hidden :: Array RP.Props -> String -> ReactElement
hidden = input "hidden"


hidden' :: Array RP.Props -> ReactElement
hidden' = input' "hidden"


password :: Array RP.Props -> String -> ReactElement
password = input "password"


password' :: Array RP.Props -> ReactElement
password' = input' "password"


text :: Array RP.Props -> String -> ReactElement
text = input "text"


text' :: Array RP.Props -> ReactElement
text' = input' "text"


email :: Array RP.Props -> String -> ReactElement
email = input "email"


email' :: Array RP.Props -> ReactElement
email' = input' "email"


submit :: Array RP.Props -> String -> ReactElement
submit = input "submit"


submit' :: Array RP.Props -> ReactElement
submit' = input' "submit"
