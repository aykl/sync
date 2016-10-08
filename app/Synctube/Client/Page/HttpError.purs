module Synctube.Client.Page.HttpError where

import Prelude

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { error :: Error }


data Error
  = NotFound (Maybe String)
  | Forbidden String
  | Generic Int String


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
            [ content state ]


content :: State -> ReactElement
content state =
  R.div [ RP.className "col-md-12" ]
        [ R.div [ RP.className "alert alert-danger" ] $
                error state.error
        ]

  where

  error :: Error -> Array ReactElement
  error (NotFound message) =
    notFound message

  error (Forbidden path) =
    forbidden path

  error (Generic status message) =
    genericError status message


notFound :: Maybe String -> Array ReactElement
notFound message =
  [ R.h1' [ R.text "Not Found" ]
  , R.p'  [ R.text """The page you were looking for doesn't seem to exist.
                    Please check that you typed the URL correctly.""" ]
  , reason message
  ]

  where

  reason :: Maybe String -> ReactElement
  reason (Just message) =
    R.p' [ R.text $ "Reason: " <> message ]

  reason Nothing =
    R.text ""


forbidden :: String -> Array ReactElement
forbidden path =
  [ R.h1' [ R.text "Forbidden" ]
  , R.p'  [ R.text "You don't have permission to access "
          , R.code' [ R.text path ] ]
  ]


genericError :: Int -> String -> Array ReactElement
genericError status message =
  [ R.h1' [ R.text "Oops" ]
  , R.p'  [ R.text "Your request could not be processed.  Status code: "
          , R.code' [ R.text $ show status ]
          , R.text ", message: "
          , R.code' [ R.text message ] ]
  ]
