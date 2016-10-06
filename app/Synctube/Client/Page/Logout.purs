module Synctube.Client.Page.Logout where

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { redirect :: Maybe String }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
    [ R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ R.div [ RP.className "alert alert-info center messagebox" ]
            [ R.strong' [ R.text "Logged out" ]
            , R.p' [ redirect state.redirect ]
            ]
        ]
    ]


redirect :: Maybe String -> ReactElement
redirect (Just url) =
  R.a [ RP.href url ] [ R.text "Return to previous page" ]

redirect Nothing =
  R.text ""
