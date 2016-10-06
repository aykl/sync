module Synctube.Client.Page.Tos where

import Prelude

import Data.Tuple.Nested ((/\))
import Data.TemplateString ((<^>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { siteTitle :: String
  , domain :: String
  }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
    [ R.div [ RP.className "container" ] $
        [ userAgreement state ] <> generalRules state
    ]


generalRules :: State -> Array ReactElement
generalRules state =
  [ R.h3 [] [ R.text "General Rules" ]
  , R.p []
      [ R.text $
          "While moderation is largely left to the discretion of \
          \channel moderators and administrators, \
          \the following rules apply globally and must be observed \
          \at all times on the site.  \
          \Failure to comply with these rules may result in \
          \temporary or permanent removal of your user account \
          \from the website."
      ]
  , R.ul []
      [ R.li []
          [ R.text $
              "Trolling, spamming, or otherwise intentionally \
              \disrupting any channel is not allowed"
          ]
      , R.li []
          [ R.text $
              "Bullying or otherwise intending to hurt \
              \other users is not allowed"
          ]
      , R.li []
          [ R.text $
              "Attempting to exploit the site in order to gain \
              \unauthorized access or interrupt service \
              \is not allowed.  \
              \If you believe you have found an exploit, \
              \please responsibly disclose it to an administrator."
          ]
      , R.li []
          [ R.text $
              "Use good judgement when representing ${site} \
              \on other websites.  \
              \Do not spam links to your channel." <^>
              [ "site" /\ state.siteTitle ]
          ]
      ]
  ]


userAgreement :: State -> ReactElement
userAgreement state =
  R.div [ RP.className "col-md-12" ]
    [ R.h1 [] [ R.text "User Agreement" ]
    , R.p []
        [ R.text $
            "By visiting ${title} (${domain}), \
            \you agree to the following user agreement." <^>
            [ "title" /\ state.siteTitle, "domain" /\ state.domain ]
        ]
    , R.h3 [] [ R.text "Legal Stuff" ]
    , R.ul []
        [ R.li []
            [ R.text $
                "All content and activity this website must comply with \
                \United States law, and where applicable, local laws.  \
                \Prohibited content and activities include, \
                \but are not limited to:"
            , R.ul []
                [ R.li [] [ R.text "Child pornography" ]
                , R.li [] [ R.text "Warez" ]
                , R.li [] [ R.text "Copyright infringement" ]
                , R.li []
                    [ R.text
                        "Blackmail, slander, or other defamatory statements"
                    ]
                , R.li [] [ R.text "Phishing" ]
                ]
            ]
        , R.li []
            [ R.text $
                "Content on ${site} is provided \"as-is\".  \
                \${site} makes no warranties, \
                \express or implied, \
                \and hereby disclaims and negates all other warranties, \
                \including, without limitation, implied warranties \
                \or conditions of merchantability, \
                \fitness for a particular purpose, or non-infringement \
                \of intellectual property or other violation of rights.  \
                \Furthermore, ${site} does not make any \
                \representations concerning the accuracy or reliability \
                \of content present on ${site}." <^>
                [ "site" /\ state.siteTitle ]
            ]
        , R.li []
            [ R.text $
                "${site} permits users to share links, \
                \embedded content, or other content insofar as the shared \
                \content complies with this user agreement, \
                \United States law, and where applicable, local laws.  \
                \${site} is not responsible for the content shared, \
                \or any consequences of sharing such content.  \
                \${site} does not endorse any user-provided content.  \
                \Viewing shared content is done at the user's own risk." <^>
                [ "site" /\ state.siteTitle ]
            ]
        ]
    ]
