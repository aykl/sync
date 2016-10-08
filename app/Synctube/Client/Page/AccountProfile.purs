module Synctube.Client.Page.AccountProfile where

import Data.Tuple.Nested ((/\))
import Data.Maybe (Maybe(..))
import Data.TemplateString ((<^>))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { profile :: Maybe Profile
  , error :: Maybe String
  , csrfToken :: String
  }


type Profile =
  { image :: String
  , login :: String
  , text :: String
  }



mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage", RP.className "container" ]
            [ R.div [ RP.className "container" ]
                    [ content state ]
            ]


scripts :: State -> Array ReactElement
scripts state =
  [ R.script  [ RP._type "text/javascript"
              , RP.dangerouslySetInnerHTML { __html: scriptBody state }
              ] []
  ]

  where

  scriptBody state@{ profile: Just profile} =
    """$("#profileimage").val("#{profileImage}");"""
    <^> [ "profileImage" /\ profile.image ]

  scriptBody state =
    ""


content :: State -> ReactElement
content state@{ profile: Nothing } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ R.div [ RP.className "alert alert-danger messagebox center" ]
                [ R.strong' [ R.text "Authorization Required" ]
                , R.p'  [ R.text "You must be "
                        , R.a [ RP.href "/login" ] [ R.text "logged in" ]
                        , R.text " to view this page."
                        ]
                ]
        ]

content state@{ profile: Just profile } =
  R.div [ RP.className "col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3" ]
        [ R.h3' [ R.text "Profile" ]
        , profileError state.error
        , profileBox
        , R.h3' [ R.text "Edit Profile" ]
        , profileForm
        ]

  where

  profileBox :: ReactElement
  profileBox =
    R.div [ RP.className "profile-box linewrap"
          , RP.style { "position": "inherit", "z-index": "auto" }
          ]
          [ R.img [ RP.className "profile-image", RP.src profile.image ] []
          , R.strong' [ R.text profile.login ]
          , R.p' [ R.text profile.text ]
          ]

  profileForm :: ReactElement
  profileForm =
    R.form  [ RP.action "/account/profile", RP.method "post", RP.role "form" ]
            [ I.hidden [ RP.name "_csrf" ] state.csrfToken
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label"
                              , RP.htmlFor "profileimage"
                              ]
                              [ R.text "Image" ]
                    , I.text' [ RP._id "profileimage"
                              , RP.className "form-control"
                              , RP.name "image" ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label"
                              , RP.htmlFor "profiletext"
                              ]
                              [ R.text "Text" ]
                    , R.textarea  [ RP._id "profiletext"
                                  , RP.className "form-control"
                                  , RP.cols "10", RP.name "text"
                                  ]
                                  [ R.text profile.text ]
                    ]
            , R.button  [ RP.className "btn btn-primary btn-block"
                        , RP._type "submit"
                        ]
                        [ R.text "Save" ]
            ]

  profileError :: Maybe String -> ReactElement
  profileError (Just error) =
    R.div [ RP.className "alert alert-danger center messagebox" ]
          [ R.strong' [ R.text "Profile Error" ]
          , R.p' [ R.text error ]
          ]

  profileError Nothing =
    R.text ""
