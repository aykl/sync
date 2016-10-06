module Synctube.Client.Page.GoogleDriveUserscript where

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ]
        [ R.div [ RP.className "col-md-8 col-md-offset-2" ]
            [ R.h1' [ R.text "Google Drive Userscript" ]
            , R.h2' [ R.text "Why?" ]
            , R.p' [ R.text why ]
            , R.h2' [ R.text "How It Works" ]
            , R.p' [ R.text howItWorks ]
            , R.h2' [ R.text "Installation" ]
            , R.ul' browsers
            , R.p' onceYouHaveInstalled
            , R.p' guide
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


why :: String
why =
  "Since Google Drive support was launched in early 2014, it has broken \
  \at least 4-5 times, requiring increasing effort to get it working again \
  \and disrupting many channels.  This is because there is no official API \
  \for it like there is for YouTube videos, which means support for it \
  \relies on undocumented tricks.  In August 2016, the decision was made \
  \to phase out the native support for Google Drive and instead require \
  \users to install a userscript, which allows to bypass certain browser \
  \restrictions and make the code easier, simpler, and less prone to failure \
  \(it could still break due to future Google Drive changes, but is less \
  \likely to be difficult to fix)."

howItWorks :: String
howItWorks =
  "The userscript is a short script that you can install using a browser \
  \extension such as Greasemonkey or Tampermonkey that runs on the page \
  \and provides additional functionality needed to play Google Drive \
  \videos."


browsers :: Array ReactElement
browsers =
  [ R.li'
      [ R.strong' [ R.text "Chrome" ]
      , R.text "—Install "
      , R.a
          [ RP.href "https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
          , RP.target "_blank"
          ]
          [ R.text "Tampermonkey" ]
      , R.text "."
      ]
  , R.li'
      [ R.strong' [ R.text "Firefox" ]
      , R.text "—Install "
      , R.a
          [ RP.href "https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/"
          , RP.target "_blank"
          ]
          [ R.text "Tampermonkey" ]
      , R.text "or "
      , R.a
          [ RP.href "https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/"
          , RP.target "_blank"
          ]
          [ R.text "Greasemonkey" ]
      , R.text "."
      ]
  , R.li'
      [ R.strong' [ R.text "Other Browsers" ]
      , R.text "—Install the appropriate userscript plugin for your browser."
      , R.text "Tampermonkey supports many browsers besides Chrome."
      ]
  ]


onceYouHaveInstalled :: Array ReactElement
onceYouHaveInstalled =
  [ R.text "Once you have installed the userscript manager addon "
  , R.text "for your browser, you can "
  , R.a [ RP.href "/js/cytube-google-drive.user.js?v=1.1", RP.target "_blank" ]
      [ R.text "install the userscript" ]
  , R.text ".  If this link 404s, it means the administrator"
  , R.text "of this server hasn't generated it yet."
  ]


guide :: Array ReactElement
guide =
  [ R.text "You can find a guide with screenshots of the installation process"
  , R.a
      [ RP.href "https://github.com/calzoneman/sync/wiki/Google-Drive-Userscript-Installation-Guide"
      , RP.target "_blank"
      ]
      [ R.text "on GitHub" ]
  , R.text "."
  ]
