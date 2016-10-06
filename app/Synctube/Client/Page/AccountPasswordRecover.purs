module Synctube.Client.Page.AccountPasswordRecover where

import Prelude

import Data.Either (Either(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { recoveredPassword :: Either String String }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ R.div
            [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
            [ R.h3 [] [ R.text "Recover Password" ]
            , recoverMessage state.recoveredPassword
            ]
        ]
    ]


recoverMessage :: Either String String -> ReactElement
recoverMessage (Right recoverPassword) =
  R.div [ RP.className "alert alert-success center messagebox" ]
    [ R.strong [] [ R.text "Your password has been changed" ]
    , R.p []
        [ R.text "Your account has been assigned the temporary password "
        , R.code [] [ R.text recoverPassword ]
        , R.text $
            ".  You may now use this password to log in \
            \and choose a new password by visiting the "
        , R.a [ RP.href "/account/edit" ]
            [ R.text "change password/email" ]
        , R.text "page."
        ]
    ]

recoverMessage (Left recoverErr) =
  R.div [ RP.className "alert alert-danger center messagebox" ]
    [ R.strong [] [ R.text "Password recovery failed" ]
    , R.p [] [ R.text recoverErr ]
    ]
