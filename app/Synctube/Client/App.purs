module Synctube.Client.App where

import Prelude

import Synctube.Client.Page as SyncPage
import Synctube.Client.Nav as Nav
import Synctube.Client.Page.Index as Index
import Synctube.Client.Page.AccountChannels as AccountChannels
import Synctube.Client.Page.AccountEdit as AccountEdit
import Synctube.Client.Page.AccountPasswordRecover as AccountPasswordRecover
import Synctube.Client.Page.AccountPasswordReset as AccountPasswordReset
import Synctube.Client.Page.AccountProfile as AccountProfile
import Synctube.Client.Page.Acp as Acp
import Synctube.Client.Page.Channel as Channel
import Synctube.Client.Page.Contact as Contact
import Synctube.Client.Page.CsrfError as CsrfError
import Synctube.Client.Page.GoogleDriveUserscript as GoogleDriveUserscript
import Synctube.Client.Page.HttpError as HttpError
import Synctube.Client.Page.Login as Login
import Synctube.Client.Page.Logout as Logout
import Synctube.Client.Page.Register as Register
import Synctube.Client.Page.Tos as Tos
import Synctube.Client.Footer as Footer

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


type State =
  { page :: SyncPage.Page
  , nav :: Nav.State
  }


init :: SyncPage.Page -> Nav.State -> State
init page nav =
  { page, nav }


update :: forall a. a -> State -> State
update _ = id


view :: State -> ReactElement
view state =
  R.div [ RP.style {"height": "100%"} ] $
    [ R.div [ RP._id "wrap" ]
        [ Nav.view state.page state.nav "siteTitle"
        , mainpageSection state.page
        ]
    ] <> otherSections state.page <>
    [ Footer.footer
    , scripts state.page
    ]


mainpageSection :: SyncPage.Page -> ReactElement
mainpageSection (SyncPage.Index pageState) =
  Index.mainpageSection pageState

mainpageSection (SyncPage.AccountChannels pageState) =
  AccountChannels.mainpageSection pageState

mainpageSection (SyncPage.AccountEdit pageState) =
  AccountEdit.mainpageSection pageState

mainpageSection (SyncPage.AccountPasswordRecover pageState) =
  AccountPasswordRecover.mainpageSection pageState

mainpageSection (SyncPage.AccountPasswordReset pageState) =
  AccountPasswordReset.mainpageSection pageState

mainpageSection (SyncPage.AccountProfile pageState) =
  AccountProfile.mainpageSection pageState

mainpageSection (SyncPage.Acp pageState) =
  Acp.mainpageSection pageState

mainpageSection (SyncPage.Channel pageState) =
  Channel.mainpageSection pageState

mainpageSection (SyncPage.Contact pageState) =
  Contact.mainpageSection pageState

mainpageSection (SyncPage.CsrfError pageState) =
  CsrfError.mainpageSection pageState

mainpageSection (SyncPage.GoogleDriveUserscript pageState) =
  GoogleDriveUserscript.mainpageSection pageState

mainpageSection (SyncPage.HttpError pageState) =
  HttpError.mainpageSection pageState

mainpageSection (SyncPage.Login pageState) =
  Login.mainpageSection pageState

mainpageSection (SyncPage.Logout pageState) =
  Logout.mainpageSection pageState

-- mainpageSection (SyncPage.PrivacyPolicy pageState) =
--   PrivacyPolicy.mainpageSection pageState

mainpageSection (SyncPage.Register pageState) =
  Register.mainpageSection pageState

mainpageSection (SyncPage.Tos pageState) =
  Tos.mainpageSection pageState

mainpageSection _ =
  R.div [] [ R.text "Not implemented" ]


otherSections :: SyncPage.Page -> Array ReactElement
otherSections (SyncPage.Channel state) =
  Channel.otherSections state

otherSections _ = []


scripts :: SyncPage.Page -> ReactElement
scripts (SyncPage.Index _) =
  R.div [] Index.scripts

scripts (SyncPage.AccountChannels _) =
  R.div [] AccountChannels.scripts

scripts (SyncPage.AccountEdit _) =
  R.div [] AccountEdit.scripts

scripts (SyncPage.AccountProfile state) =
  R.div [] $ AccountProfile.scripts state

scripts (SyncPage.Acp state) =
  R.div [] $ Acp.scripts state

scripts (SyncPage.Channel state) =
  R.div [] $ Channel.scripts state

scripts (SyncPage.Contact _) =
  R.div [] $ Contact.scripts

scripts (SyncPage.GoogleDriveUserscript _) =
  R.div [] GoogleDriveUserscript.scripts

scripts (SyncPage.Register _) =
  R.div [] Register.scripts

scripts _ =
  R.div [] []
