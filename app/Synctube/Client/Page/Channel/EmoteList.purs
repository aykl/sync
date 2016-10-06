module Synctube.Client.Page.Channel.EmoteList (emoteList) where

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


emoteList :: ReactElement
emoteList =
  R.div
    [ RP._id "emotelist", RP.className "modal fade"
    , RP.tabIndex "-1", RP.role "dialog", RP.aria {hidden: "true"}
    ]
    [ R.div [ RP.className "modal-dialog modal-dialog-nonfluid" ]
        [ R.div [ RP.className "modal-content" ]
            [ header
            , body
            , footer
            ]
        ]
    ]


header :: ReactElement
header =
  R.div [ RP.className "modal-header" ]
    [ R.button
        [ RP.className "close"
        , RP._data {dismiss: "modal"}
        , RP.aria {hidden: "true"}
        ]
        [ R.text "×" ]
    , R.h4' [ R.text "Emote List" ]
    ]


body :: ReactElement
body =
  R.div [ RP.className "modal-body" ]
    [ R.div [ RP.className "pull-left" ]
        [ R.input
            [ RP.className "emotelist-search form-control"
            , RP._type "text", RP.placeholder "Search"
            ] []
        ]
    , R.div [ RP.className "pull-right" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.label'
                [ R.input
                    [ RP.className "emotelist-alphabetical"
                    , RP._type "checkbox"
                    ] []
                , R.text "Sort alphabetically"
                ]
            ]
        ]
    , R.div [ RP.className "emotelist-paginator-container" ] []
    , R.table [ RP.className "emotelist-table" ]
        [ R.tbody' [] ]
    ]


footer :: ReactElement
footer =
  R.div [ RP.className "modal-footer" ] []
