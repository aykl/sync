module Synctube.Client.Page.Channel.UserOptions (userOptions) where

import Prelude

import Data.String as String
import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


userOptions :: ReactElement
userOptions =
  R.div
    [ RP._id "useroptions", RP.className "modal fade"
    , RP.tabIndex "-1", RP.role "dialog", RP.aria {hidden: "true"}
    ]
    [ R.div [ RP.className "modal-dialog" ]
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
        [ RP.className "close", RP._data {dismiss: "modal"}
        , RP.aria {hidden: "true"}
        ]
        [ R.text "×" ]
    , R.h4' [ R.text "User Preferences" ]
    , R.ul [ RP.className "nav nav-tabs" ]
        [ R.li'
            [ R.a [ RP.href "#us-general", RP._data {toggle: "tab"} ]
                [ R.text "General" ]
            ]
        , R.li'
            [ R.a [ RP.href "#us-playback", RP._data {toggle: "tab"} ]
                [ R.text "Playback" ]
            ]
        , R.li'
            [ R.a [ RP.href "#us-chat", RP._data {toggle: "tab"} ]
                [ R.text "Chat" ]
            ]
        , R.li'
            [ R.a [ RP.href "#us-scriptcontrol", RP._data {toggle: "tab"} ]
                [ R.text "Script Access" ]
            ]
        , R.li'
            [ R.a [ RP.href "#us-mod", RP._data {toggle: "tab"}, RP.style {}]
                [ R.text "Moderator" ]
            ]
        ]
    ]


body :: ReactElement
body =
  R.div [ RP.className "modal-body" ]
    [ R.div [ RP.className "tab-content" ]
        [ usGeneral
        , usPlayback
        , usChat
        , usScripts
        , usMod
        ]
    ]


footer :: ReactElement
footer =
  R.div [ RP.className "modal-footer" ]
    [ R.button
        [ RP.className "btn btn-primary _tempClass_saveUserOptions"
        , RP._type "button", RP._data {dismiss: "modal"}
        ]
        [ R.text "Save" ]
    , R.button
        [ RP.className "btn btn-default"
        , RP._type "button", RP._data {dismiss: "modal"}
        ]
        [ R.text "Close" ]
    ]




lcheckbox :: String -> String -> ReactElement
lcheckbox _id label =
  R.div [ RP.className "form-group" ]
    [ R.label
        [ RP.className "control-label col-sm-4"
        , RP.htmlFor _id
        ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.input [ RP._type "checkbox", RP._id _id ] []
            ]
        ]
    ]


rcheckbox :: String -> String -> ReactElement
rcheckbox _id label =
  R.div [ RP.className "form-group" ]
    [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.label [ RP.htmlFor _id ]
                [ R.input [ RP._type "checkbox", RP._id _id ] []
                , R.text label
                ]
            ]
        ]
    ]


textbox :: String -> String -> Maybe String -> ReactElement
textbox _id label placeholder =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ input ]
    ]

  where
  input = case placeholder of
    Just text -> R.input [ RP._id _id, RP._type "text", RP.placeholder text] []
    Nothing -> R.input [ RP._id _id, RP._type "text"] []


usGeneral :: ReactElement
usGeneral =
  R.div [ RP._id "us-general", RP.className "tab-pane" ]
    [ R.h4 [] [ R.text "General Preferences" ]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "#us-theme"
                ]
                [ R.text "Theme" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.select [ RP._id "us-theme", RP.className "form-control" ]
                    [ R.option [ RP.value "/css/themes/light.css" ]
                        [ R.text "Light" ]
                    , R.option [ RP.value "/css/themes/bootstrap-theme.min.css" ]
                        [ R.text "Bootstrap" ]
                    , R.option [ RP.value "/css/themes/slate.css" ]
                        [ R.text "Slate" ]
                    , R.option [ RP.value "/css/themes/cyborg.css" ]
                        [ R.text "Cyborg" ]
                    , R.option [ RP.value "/css/themes/modern.css" ]
                        [ R.text "Modern" ]
                    ]
                ]
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "#us-layout"
                ]
                [ R.text "Layout" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.select [ RP._id "us-layout", RP.className "form-control" ]
                    [ R.option [ RP.value "default" ] [ R.text "Compact" ]
                    , R.option [ RP.value "synchtube" ]
                        [ R.text "Synchtube (flipped)" ]
                    , R.option [ RP.value "fluid" ] [ R.text "Fluid" ]
                    , R.option [ RP.value "synchtube-fluid" ]
                        [ R.text "Synchtube + Fluid" ]
                    , R.option [ RP.value "hd" ] [ R.text "HD" ]
                    ]
                ]
            ]
        , R.div [ RP.className "col-sm-4" ] []
        , R.div [ RP.className "col-sm-8" ]
            [ R.p [ RP.className "text-danger" ]
                [ R.text
                    "Changing layouts may require refreshing to take effect."
                ]
            ]
        , rcheckbox "us-no-channelcss" "Ignore Channel CSS"
        , rcheckbox "us-no-channeljs" "Ignore Channel Javascript"
        , R.div [ RP.className "clear" ] []
        ]
    ]


usScripts :: ReactElement
usScripts =
  R.div [ RP._id "us-scriptcontrol", RP.className "tab-pane" ]
    [ R.h4 [] [ R.text "Script Access" ]
    , R.table [ RP.className "table" ]
        [ R.thead []
            [ R.tr []
                [ R.th [] [ R.text "Channel" ]
                , R.th [] [ R.text "Type" ]
                , R.th [] [ R.text "Preference" ]
                , R.th [] [ R.text "Clear" ]
                ]
            ]
        ]
    ]


usPlayback :: ReactElement
usPlayback =
  R.div [ RP._id "us-playback", RP.className "tab-pane" ]
    [ R.h4 [] [ R.text "Playback Preferences" ]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ rcheckbox "us-synch" "Synchronize video playback"
        , textbox "us-synch-accuracy" "Synch threshold (seconds)" $ Just "2"
        , rcheckbox "us-wmode-transparent" "Set wmode=transparent"
        , R.div [ RP.className "col-sm-4" ] []
        , R.div [ RP.className "col-sm-8" ]
            [ R.p [ RP.className "text-info" ]
                [ R.text "Setting"
                , R.code [] [ R.text "wmode=transparent" ]
                , R.text $ String.joinWith " "
                    [ "allows objects to be displayed above the video player,"
                    , "but may cause performance issues on some systems."
                    ]
                ]
            ]
        , rcheckbox "us-hidevideo" "Remove the video player"
        , rcheckbox "us-playlistbuttons" "Hide playlist buttons by default"
        , rcheckbox "us-oldbtns" "Old style playlist buttons"
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "#us-default-quality"
                ]
                [ R.text "Quality Preference" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.select
                    [ RP._id "us-default-quality"
                    , RP.className "form-control"
                    ]
                    [ R.option [ RP.value "auto" ] [ R.text "Auto" ]
                    , R.option [ RP.value "240" ] [ R.text "240p" ]
                    , R.option [ RP.value "360" ] [ R.text "360p" ]
                    , R.option [ RP.value "480" ] [ R.text "480p" ]
                    , R.option [ RP.value "720" ] [ R.text "720p" ]
                    , R.option [ RP.value "1080" ] [ R.text "1080p" ]
                    , R.option [ RP.value "best" ]
                        [ R.text "Highest Available" ]
                    ]
                ]
            ]
        ]
    ]


usChat :: ReactElement
usChat =
  R.div [ RP._id "us-chat", RP.className "tab-pane" ]
    [ R.h4 [] [ R.text "Chat Preferences" ]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ rcheckbox "us-chat-timestamp" "Show timestamps in chat"
        , rcheckbox "us-sort-rank" "Sort userlist by rank"
        , rcheckbox "us-sort-afk" "Sort AFKers to bottom"
        , R.div [ RP.className "col-sm-4" ] []
        , R.div [ RP.className "col-sm-8" ]
            [ R.p [ RP.className "text-info" ]
                [ R.text $ String.joinWith " "
                    [ "The following 2 options apply to how and when"
                    , "you will be notified if a new chat message"
                    , "is received while CyTube is not the active window."
                    ]
                ]
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "#us-blink-title"
                ]
                [ R.text "Blink page title on new messages" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.select
                    [ RP._id "us-blink-title"
                    , RP.className "form-control"
                    ]
                    [ R.option [ RP.value "never" ] [ R.text "Never" ]
                    , R.option [ RP.value "onlyping" ]
                        [ R.text "Only when I am mentioned or PMed" ]
                    , R.option [ RP.value "always" ] [ R.text "Always" ]
                    ]
                ]
            ]
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "#us-ping-sound"
                ]
                [ R.text "Notification sound on new messages" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.select
                    [ RP._id "us-ping-sound"
                    , RP.className "form-control"
                    ]
                    [ R.option [ RP.value "never" ] [ R.text "Never" ]
                    , R.option [ RP.value "onlyping" ]
                        [ R.text "Only when I am mentioned or PMed" ]
                    , R.option [ RP.value "always" ] [ R.text "Always" ]
                    ]
                ]
            ]
        , rcheckbox "us-sendbtn" "Add a send button to chat"
        , rcheckbox "us-no-emotes" "Disable chat emotes"
        , rcheckbox "us-strip-image" "Remove images from chat"
        ]
    ]


usMod :: ReactElement
usMod =
  R.div [ RP._id "us-mod", RP.className "tab-pane" ]
    [ R.h4 [] [ R.text "Moderator Preferences" ]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ rcheckbox "us-modflair" "Show name color"
        , rcheckbox "us-shadowchat" "Show shadowmuted messages"
        ]
    ]
