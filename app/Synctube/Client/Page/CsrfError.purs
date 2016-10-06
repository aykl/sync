module Synctube.Client.Page.CsrfError where

import Prelude

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { referer :: Maybe String
  , path :: String
  }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
    [ content state ]

content :: State -> ReactElement
content state =
  R.div [ RP.className "col-md-12" ]
    [ R.div [ RP.className "alert alert-danger" ]
        [ R.h1 [] [ R.text "Invalid Session" ]
        , R.p []
            [ R.text "Your browser attempted to submit form data to "
            , R.code [] [ R.text state.path ]
            , R.text " with an invalid authentication token.  This may be because:"
            , R.ul []
                [ R.li []
                    [ R.text "Your session has expired" ]
                , R.li []
                    [ R.text "Your request was missing the authentication token" ]
                , R.li []
                    [ R.text
                        "A malicious user has attempted to tamper with your session"
                    ]
                , R.li []
                    [ R.text $
                        "Your browser does not support cookies, \
                        \or they are not enabled"
                    ]
                ]
            , R.text "If the problem persists, please contact an administrator."
            ]
        , refererLink state.referer
        ]
    ]


refererLink :: Maybe String -> ReactElement
refererLink (Just referer) =
  R.a [ RP.href "referer" ] [ R.text "Return to previous page" ]

refererLink Nothing =
  R.text ""
