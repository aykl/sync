module Synctube.Client.Page.Contact where

import Prelude

import Data.Array (concatMap)

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { contacts :: Array Contact }


type Contact =
  { name :: String
  , title :: String
  , email :: String
  , emkey :: String
  }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ R.div [ RP.className "col-md-8 col-md-offset-2" ] $
            [ R.h1' [ R.text "Contact" ]
            , R.h3' [ R.text "Email" ]
            ] <> contacts state.contacts <>
            [ R.h3' [ R.text "IRC" ]
            , R.p'
                [ R.text
                    """The developer and other knowledgeable people are usually
                    available on IRC for quick questions or comments.
                    Official support can be provided for cytu.be
                    and synchtube.6irc.net at """
                , R.a [ RP.href "http://webchat.6irc.net/?channels=cytube" ]
                    [ R.text "irc.6irc.net#cytube" ]
                , R.text
                    """.  These people can also address general questions
                    about the software, but cannot provide technical support
                    for third-party websites using this code."""
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
    """function showEmail(btn, email, key) {
      email = unescape(email);
      key = unescape(key);
      var dest = new Array(email.length);
      for (var i = 0; i < email.length; i++) {
        dest[i] = String.fromCharCode(email.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      email = dest.join("");
      $("<a/>").attr("href", "mailto:" + email)
        .text(email)
        .insertBefore(btn);
      $(btn).remove();
    }"""


contacts :: Array Contact -> Array ReactElement
contacts contactList = concatMap showContact contactList
  where

  showContact :: Contact -> Array ReactElement
  showContact contact =
    [ R.strong' [ R.text contact.name ]
    , R.p [ RP.className "text-muted" ] [ R.text contact.title ]
    , email contact.email contact.emkey
    , R.br' []
    , R.hr' []
    ]


email :: String -> String -> ReactElement
email e k =
  R.button
    [ RP.className "btn btn-xs btn-default"
    , RP.unsafeMkProps "onclick" $
        "showEmail(this, '" <> e <> "', '" <> k <> "')"
    ]
    [ R.text "Show Email" ]
