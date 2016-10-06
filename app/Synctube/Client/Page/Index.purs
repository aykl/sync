module Synctube.Client.Page.Index where

import Prelude

import Data.Tuple.Nested ((/\))
import Data.TemplateString ((<^>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type Channel =
  { name :: String
  , pagetitle :: String
  , usercount :: Int
  , mediatitle :: String
  }


type State = { channels :: Array Channel }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ R.div [ RP.className "col-lg-9 col-md-9" ]
            [ R.h3 [] [ R.text "Public Channels" ]
            , R.table [ RP.className "table table-bordered table-striped" ]
                [ R.thead []
                    [ R.th [] [ R.text "Channel" ]
                    , R.th [] [ R.text "# Connected" ]
                    , R.th [] [ R.text "Now Playing" ]
                    ]
                , R.tbody []
                    $ map channelRow state.channels
                ]
            ]
        , R.div [ RP.className "col-lg-3 col-md-3" ]
            [ R.h3 [] [ R.text "Enter Channel" ]
            , R.input
                [ RP._id "channelname"
                , RP.className "form-control"
                , RP._type "text"
                , RP.placeholder "Channel Name" ] []
            , R.p [ RP.className "text-muted" ]
                [ R.text "New channels can be registered from the "
                , R.a [ RP.href "/account/channels" ] [ R.text "My Channels" ]
                , R.text " page."
                ]
            ]
        ]
    ]


scripts :: Array ReactElement
scripts =
  [ R.script
      [ RP._type "text/javascript"
      , RP.dangerouslySetInnerHTML { __html: scriptBody }
      ]
      []
  ]

  where

  scriptBody =
    """$("#channelname").keydown(function (ev) {
      if (ev.keyCode === 13) {
        location.href = "/r/" + $("#channelname").val();
      }
    });"""


channelRow :: Channel -> ReactElement
channelRow chan =
  R.tr []
    [ R.td []
        [ R.a [ RP.href $ "/r/" <> chan.name ]
            [ R.text $
                "${title} (${name})" <^>
                [ "title" /\ chan.pagetitle, "name" /\ chan.name ]
            ]
        ]
    , R.td [] [ R.text $ show chan.usercount ]
    , R.td [] [ R.text chan.mediatitle ]
    ]
