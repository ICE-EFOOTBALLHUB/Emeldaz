// ---------- SHARED PHONE INPUT (country code + number) ----------
// Used by book.html (`customerPhone`) and order.html (`orderPhone`).
// admin.html has no phone *input* fields — it only ever displays numbers
// that were already saved by these two pages — so it does not use this file.
//
// Renders a "<select> country/dial code" + "<input type=tel> number" pair
// into a container element, defaulting to Nigeria (+234) but changeable to
// any of the countries below. The saved value is always a single
// international string, e.g. "+2349043709147" — for Nigeria specifically, a
// leading 0 typed by the customer is dropped, so "0904 370 9147" and
// "904 370 9147" both save the same way. Existing saved numbers (including
// ones with no leading "+") are left exactly as they were unless a customer
// actively re-edits that field.

// ISO 3166-1 alpha-2 code, display name, and E.164 dial code (no "+").
// Shown as e.g. "NG +234" rather than a flag emoji, since flag emoji don't
// render on Windows browsers. Nigeria is listed first as the default;
// the rest are alphabetical by country name.
const COUNTRIES = [
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'AT', name: 'Austria', dial: '43' },
  { iso: 'BE', name: 'Belgium', dial: '32' },
  { iso: 'BR', name: 'Brazil', dial: '55' },
  { iso: 'CM', name: 'Cameroon', dial: '237' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'CD', name: 'Congo (DRC)', dial: '243' },
  { iso: 'DK', name: 'Denmark', dial: '45' },
  { iso: 'EG', name: 'Egypt', dial: '20' },
  { iso: 'FI', name: 'Finland', dial: '358' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'IE', name: 'Ireland', dial: '353' },
  { iso: 'IT', name: 'Italy', dial: '39' },
  { iso: 'CI', name: 'Ivory Coast', dial: '225' },
  { iso: 'JP', name: 'Japan', dial: '81' },
  { iso: 'KE', name: 'Kenya', dial: '254' },
  { iso: 'MY', name: 'Malaysia', dial: '60' },
  { iso: 'NL', name: 'Netherlands', dial: '31' },
  { iso: 'NZ', name: 'New Zealand', dial: '64' },
  { iso: 'NO', name: 'Norway', dial: '47' },
  { iso: 'PK', name: 'Pakistan', dial: '92' },
  { iso: 'PL', name: 'Poland', dial: '48' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966' },
  { iso: 'SN', name: 'Senegal', dial: '221' },
  { iso: 'SG', name: 'Singapore', dial: '65' },
  { iso: 'ZA', name: 'South Africa', dial: '27' },
  { iso: 'KR', name: 'South Korea', dial: '82' },
  { iso: 'ES', name: 'Spain', dial: '34' },
  { iso: 'SE', name: 'Sweden', dial: '46' },
  { iso: 'CH', name: 'Switzerland', dial: '41' },
  { iso: 'TZ', name: 'Tanzania', dial: '255' },
  { iso: 'TG', name: 'Togo', dial: '228' },
  { iso: 'TR', name: 'Turkey', dial: '90' },
  { iso: 'UG', name: 'Uganda', dial: '256' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'ZM', name: 'Zambia', dial: '260' }
];

// Dial codes sorted longest-first, so parsing "+2349..." checks "234"
// before a shorter code could wrongly match a prefix of it.
const COUNTRIES_BY_DIAL_DESC = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function countryOptionsHtml(selectedIso) {
  return COUNTRIES.map(c =>
    `<option value="${c.iso}" data-dial="${c.dial}"${c.iso === selectedIso ? ' selected' : ''}>${c.iso} +${c.dial}</option>`
  ).join('');
}

/**
 * Renders a country-code select + phone number input into `container`
 * (an existing element, its previous contents are replaced) and wires up
 * reading/writing a single international value.
 *
 * @param {HTMLElement} container
 * @param {Object} [opts]
 * @param {string} [opts.id] - id given to the underlying <input>, so
 *   existing <label for="..."> markup keeps working.
 * @param {boolean} [opts.required]
 * @param {string} [opts.placeholder]
 * @param {string} [opts.defaultIso] - defaults to Nigeria.
 * @param {string} [opts.initialValue] - a previously-saved number, if any.
 * @returns {{ getValue: () => string, setValue: (v: string) => void,
 *   hasNumber: () => boolean, focus: () => void }}
 */
function mountPhoneInput(container, opts = {}) {
  const {
    id = 'phoneNumber',
    required = true,
    placeholder = 'e.g. 0904 370 9147',
    defaultIso = 'NG',
    initialValue = ''
  } = opts;

  container.innerHTML = `
    <div class="phone-input-row">
      <select class="phone-country-select" id="${id}-country" aria-label="Country code">
        ${countryOptionsHtml(defaultIso)}
      </select>
      <input type="tel" class="phone-number-input" id="${id}" inputmode="tel"
        placeholder="${placeholder}" autocomplete="tel"${required ? ' required' : ''}>
    </div>`;

  const countrySelect = container.querySelector(`#${id}-country`);
  const numberInput = container.querySelector(`#${id}`);

  function currentDial() {
    const opt = countrySelect.selectedOptions[0];
    return opt ? opt.dataset.dial : '234';
  }

  // Builds the saved international string, e.g. "+2349043709147".
  // Nigeria-specific: drop one leading 0 from the typed number, since
  // Nigerian numbers are conventionally typed as "0904..." locally but the
  // country code already implies the leading 0 is dropped.
  function getValue() {
    const dial = currentDial();
    let digits = numberInput.value.replace(/\D/g, '');
    if (dial === '234' && digits.startsWith('0')) digits = digits.slice(1);
    if (!digits) return '';
    return `+${dial}${digits}`;
  }

  function hasNumber() {
    return numberInput.value.replace(/\D/g, '').length > 0;
  }

  function focus() {
    numberInput.focus();
  }

  // Accepts a previously-saved value (ideally "+2349043709147", but also
  // tolerates older numbers saved without a "+") and splits it back into a
  // country selection + local number for editing. Falls back to putting the
  // raw text in the number box untouched if no known dial code matches, so
  // nothing is ever silently dropped.
  function setValue(value) {
    const v = String(value || '').trim();
    if (!v) { numberInput.value = ''; return; }
    if (v.startsWith('+')) {
      const digits = v.slice(1);
      const match = COUNTRIES_BY_DIAL_DESC.find(c => digits.startsWith(c.dial));
      if (match) {
        countrySelect.value = match.iso;
        numberInput.value = digits.slice(match.dial.length);
        return;
      }
    }
    numberInput.value = v;
  }

  if (initialValue) setValue(initialValue);

  return { getValue, setValue, hasNumber, focus };
}

export { mountPhoneInput };
   
