module Synctube.Client.Component.Footer (footer) where

import Prelude (($), (<>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


footer :: ReactElement
footer =
  R.footer  [ RP._id "footer" ] $
            [ R.div [ RP.className "container" ]
                    [ R.p [ RP.className "text-muted credit" ]
                          [ copyright
                          , R.text " · "
                          , githubLink
                          , R.text " · "
                          , userAgreement
                          , R.text " · "
                          , contact
                          , R.text " · "
                          , wikiLink
                          ]
                    ]
            ] <> scripts


copyright :: ReactElement
copyright =
  R.text "Copyright © 2013-2016 Calvin Montgomery"


userAgreement :: ReactElement
userAgreement =
  R.a [ RP.href "/useragreement", RP.target "_blank" ]
      [ R.text "User Agreement" ]


contact :: ReactElement
contact =
  R.a [ RP.href "/contact", RP.target "_blank" ]
      [ R.text "Contact" ]


githubLink :: ReactElement
githubLink =
  R.a [ RP.href "https://github.com/calzoneman/sync", RP.target "_blank"
      , RP.rel "noreferrer noopener"
      ]
      [ R.text "GitHub" ]


wikiLink :: ReactElement
wikiLink =
  R.a [ RP.href "https://github.com/calzoneman/sync/wiki", RP.target "_blank"
      , RP.rel "noopener noreferrer"
      ]
      [ R.text "Wiki" ]


scripts :: Array ReactElement
scripts =
  [ R.script  [ RP.src "/js/jquery-1.11.0.min.js" ] []
  -- Must be included before jQuery-UI
  -- since jQuery-UI overrides jQuery.fn.button
  -- I should really abandon this crap one day
  , R.script  [ RP.src "/js/jquery-ui.js" ] []
  , R.script  [ RP.src "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js" ]
              []
  ]
