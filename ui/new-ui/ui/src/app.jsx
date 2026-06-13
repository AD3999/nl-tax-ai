/* TaxWijs — App composition (design canvas) */

const MOBILE_W = 390, MOBILE_H = 780;
const DESKTOP_W = 1280, DESKTOP_H = 880;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "userType": "zzp"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Chat persona" subtitle="Changes the question deck and the live answer on every chat artboard.">
          <TweakRadio
            label="User type"
            value={t.userType}
            onChange={(v) => setTweak("userType", v)}
            options={[
              { value: "zzp",      label: "ZZP" },
              { value: "employee", label: "Employee" },
              { value: "expat",    label: "Expat" },
              { value: "dga",      label: "DGA" },
            ]}
          />
        </TweakSection>
        <TweakSection title="About">
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
            Theme: sage on warm paper. Geist · Instrument Serif · JetBrains Mono.<br/>
            Click any artboard to focus it fullscreen. Drag to rearrange.
          </div>
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas>

        <DCSection id="system" title="01 · Design System" subtitle="Foundations: color, type, components, spacing — at a glance.">
          <DCArtboard id="system" label="System overview · 1280" width={DESKTOP_W} height={DESKTOP_H}>
            <SystemShowcase />
          </DCArtboard>
        </DCSection>

        <DCSection id="landing" title="02 · Landing" subtitle="Marketing entry. Confident, calm and grounded in real numbers.">
          <DCArtboard id="landing-desktop" label="Landing · Desktop"  width={DESKTOP_W} height={DESKTOP_H}>
            <LandingDesktop />
          </DCArtboard>
          <DCArtboard id="landing-mobile"  label="Landing · Mobile"   width={MOBILE_W}  height={MOBILE_H}>
            <LandingMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="auth" title="03 · Sign in & Register" subtitle="Two-column shell. Editorial right rail. Type-card register.">
          <DCArtboard id="login-desktop"    label="Log in · Desktop"   width={DESKTOP_W} height={DESKTOP_H}>
            <LoginDesktop />
          </DCArtboard>
          <DCArtboard id="login-mobile"     label="Log in · Mobile"    width={MOBILE_W}  height={MOBILE_H}>
            <LoginMobile />
          </DCArtboard>
          <DCArtboard id="register-desktop" label="Register · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
            <RegisterDesktop />
          </DCArtboard>
          <DCArtboard id="register-mobile"  label="Register · Mobile"  width={MOBILE_W}  height={MOBILE_H}>
            <RegisterMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="intake" title="04 · Intake wizard" subtitle="Three steps, two-minute setup. Side rail + live tip.">
          <DCArtboard id="intake-desktop" label="Intake · Desktop · Step 2" width={DESKTOP_W} height={DESKTOP_H}>
            <IntakeDesktop />
          </DCArtboard>
          <DCArtboard id="intake-mobile"  label="Intake · Mobile · Step 1"  width={MOBILE_W}  height={MOBILE_H}>
            <IntakeMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="chat" title="05 · Chat — the centerpiece" subtitle={`Question-card deck. Live answer with numbers panel. Change persona in the Tweaks panel — currently: ${USER_TYPES[t.userType]?.label || "ZZP"}.`}>
          <DCArtboard id="chat-empty"     label="Chat · Empty state"    width={DESKTOP_W} height={DESKTOP_H}>
            <ChatEmptyDesktop userType={t.userType} />
          </DCArtboard>
          <DCArtboard id="chat-desktop"   label="Chat · Active answer"  width={DESKTOP_W} height={DESKTOP_H}>
            <ChatDesktop userType={t.userType} />
          </DCArtboard>
          <DCArtboard id="chat-mobile"    label="Chat · Mobile"         width={MOBILE_W}  height={MOBILE_H}>
            <ChatMobile userType={t.userType} />
          </DCArtboard>
        </DCSection>

        <DCSection id="calc" title="06 · Calculator + results" subtitle="Pure engine output. Bracket bar, breakdown, summary cards.">
          <DCArtboard id="calc-desktop" label="Calculator · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
            <CalcDesktop />
          </DCArtboard>
          <DCArtboard id="calc-mobile"  label="Calculator · Mobile"  width={MOBILE_W}  height={MOBILE_H}>
            <CalcMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="ib" title="07 · IB Return guide" subtitle="Nine fields from the aangifte, in plain language, with Ask buttons.">
          <DCArtboard id="ib-desktop" label="IB Return · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
            <IBDesktop />
          </DCArtboard>
          <DCArtboard id="ib-mobile"  label="IB Return · Mobile"  width={MOBILE_W}  height={MOBILE_H}>
            <IBMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="sim" title="08 · Simulation (11 steps)" subtitle="Two-column shell on desktop · top-strip on mobile · big reveal at step 11.">
          <DCArtboard id="sim-desktop"   label="Simulation · Step 4"     width={DESKTOP_W} height={DESKTOP_H}>
            <SimDesktop />
          </DCArtboard>
          <DCArtboard id="sim-overview"  label="Simulation · Reveal"     width={DESKTOP_W} height={DESKTOP_H}>
            <SimOverviewDesktop />
          </DCArtboard>
          <DCArtboard id="sim-mobile"    label="Simulation · Mobile"     width={MOBILE_W}  height={MOBILE_H}>
            <SimMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="pricing" title="09 · Pricing & Upgrade" subtitle="Free vs Premium. Modal slides up over chat when the limit is hit.">
          <DCArtboard id="pricing-desktop" label="Pricing · Desktop"   width={DESKTOP_W} height={DESKTOP_H}>
            <PricingDesktop />
          </DCArtboard>
          <DCArtboard id="pricing-mobile"  label="Pricing · Mobile"    width={MOBILE_W}  height={MOBILE_H}>
            <PricingMobile />
          </DCArtboard>
          <DCArtboard id="upgrade-desktop" label="Upgrade modal · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
            <UpgradeModalDesktop />
          </DCArtboard>
          <DCArtboard id="upgrade-mobile"  label="Upgrade modal · Mobile"  width={MOBILE_W}  height={MOBILE_H}>
            <UpgradeModalMobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="admin" title="10 · Admin — internal" subtitle="Dark-rail console for the team that maintains the rules.">
          <DCArtboard id="admin-dash"  label="Admin · Dashboard"     width={DESKTOP_W} height={DESKTOP_H}>
            <AdminDashboardDesktop />
          </DCArtboard>
          <DCArtboard id="admin-rules" label="Admin · Rules table"   width={DESKTOP_W} height={DESKTOP_H}>
            <AdminRulesDesktop />
          </DCArtboard>
        </DCSection>

      </DesignCanvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
