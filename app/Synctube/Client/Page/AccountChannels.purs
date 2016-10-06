module Synctube.Client.Page.AccountChannels where

import Prelude

import Data.Array as A
import Data.Tuple.Nested ((/\))
import Data.Maybe (Maybe(..))

import Data.TemplateString ((<^>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { csrfToken :: String
  , loggedIn :: Boolean
  , channels :: Array Channel
  , newChannelError :: Maybe String
  , deleteChannelError :: Maybe String
  }


type Channel =
  { name :: String }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ] $
        content state
    ]

content :: State -> Array ReactElement
content state | not state.loggedIn =
  [ R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
      [ R.div [ RP.className "alert alert-danger messagebox center" ]
          [ R.strong [] [ R.text "Authorization Required" ]
          , R.p []
              [ R.text "You must be "
              , R.a [ RP.href "/login" ] [ R.text "logged in" ]
              , R.text " to view this page."
              ]
          ]
      ]
  ]

content state =
  [ R.div [ RP.className "col-lg-6 col-md-6" ]
      [ R.h3 [] [ R.text "My Channels" ]
      , showDeleteChannelError state.deleteChannelError
      , showChannels state.csrfToken state.channels
      ]
  , R.div [ RP.className "col-lg-6 col-md-6" ]
      [ R.h3 [] [ R.text "Register a new channel" ]
      , showNewChannelError state.newChannelError
      , R.form [ RP.action "/account/channels", RP.method "post" ]
          [ R.input
              [ RP._type "hidden", RP.name "_csrf", RP.value state.csrfToken ]
              []
          , R.input
              [ RP._type "hidden", RP.name "action", RP.value "new_channel" ]
              []
          , R.div [ RP.className "form-group" ]
              [ R.label
                  [ RP.className "control-label"
                  , RP.htmlFor "channelname"
                  ]
                  [ R.text "Channel Name" ]
              , R.input
                  [ RP._id "channelname"
                  , RP.className "form-control"
                  , RP._type "text"
                  , RP.name "name"
                  ] []
              ]
          , R.button
              [ RP.className "btn btn-primary btn-block"
              , RP._type "submit"
              ]
              [ R.text "Register" ]
          ]
      ]
  ]


showDeleteChannelError :: Maybe String -> ReactElement
showDeleteChannelError (Just error) =
  R.div [ RP.className "alert alert-danger center messagebox" ]
    [ R.strong [] [ R.text "Channel Deletion Failed" ]
    , R.p [] [ R.text error ]
    ]

showDeleteChannelError Nothing =
  R.text ""


showNewChannelError :: Maybe String -> ReactElement
showNewChannelError (Just error) =
  R.div [ RP.className "alert alert-danger messagebox center" ]
    [ R.strong [] [ R.text "Channel Registration Failed" ]
    , R.p [] [ R.text error ]
    ]

showNewChannelError Nothing =
  R.text ""


showChannels :: String -> Array Channel -> ReactElement
showChannels _csrfToken channels | A.length channels == 0 =
  R.div [ RP.className "center" ]
    [ R.strong [] [ R.text "You haven't registered any channels" ] ]

showChannels csrfToken channels =
  R.table [ RP.className "table table-bordered" ]
    [ R.thead []
        [ R.tr []
            [ R.th [] [ R.text "Channel" ] ]
        ]
    , R.tbody [] $
        map (channelRow csrfToken) channels
    ]


channelRow :: String -> Channel -> ReactElement
channelRow csrfToken channel =
  R.tr []
    [ R.th []
        [ R.form
            [ RP.className "form-inline pull-right"
            , RP.action "/account/channels"
            , RP.method "post"
            , RP.unsafeMkProps "onsubmit" $
                "return confirm('Are you sure you want to delete ${chan}?  \
                \This cannot be undone');" <^> [ "chan" /\ channel.name ]
            ]
            [ R.input
                [ RP._type "hidden"
                , RP.name "_csrf"
                , RP.value csrfToken ] []
            , R.input
                [ RP._type "hidden"
                , RP.name "action"
                , RP.value "delete_channel" ] []
            , R.input
                [ RP._type "hidden"
                , RP.name "name"
                , RP.value channel.name ] []
            , R.button
                [ RP.className "btn btn-xs btn-danger"
                , RP._type "submit"
                ]
                [ R.text "Delete"
                , R.span [ RP.className "glyphicon glyphicon-trash" ] []
                ]
            ]
        , R.a
            [ RP.href $ "/r/" <> channel.name
            , RP.style {"margin-left": "5px"}
            ]
            [ R.text channel.name ]
        ]
    ]
