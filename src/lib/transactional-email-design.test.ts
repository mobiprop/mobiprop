import { expect, test } from 'vitest';
import { renderVerificationDesign, renderResetDesign, renderWelcomeDesign, renderVisitDesign } from './transactional-email-design';
test('signup delivers a real Supabase token placeholder without a token-consuming link',()=>{
 const html=renderVerificationDesign({code:'{{ .Token }}',email:'{{ .Email }}'});
 expect(html).toContain('{{ .Token }}');expect(html).toContain('/verify-otp?email={{ .Email | urlquery }}');
 expect(html).not.toContain('token_hash=');expect(html).not.toContain('ConfirmationURL');
});
test('dynamic content is escaped and reset token is preserved',()=>{
 expect(renderWelcomeDesign({name:'<img src=x onerror=alert(1)>'})).not.toContain('<img src=x');
 expect(renderResetDesign({url:'{{ .ConfirmationURL }}',email:'{{ .Email }}'})).toContain('href="{{ .ConfirmationURL }}"');
});
test('visit requests do not claim agent confirmation',()=>{
 const html=renderVisitDesign({submittedName:'Test',tourNumber:'TR-1',scheduledAtLabel:'Tomorrow',durationLabel:'1 hour',ctaUrl:'https://example.com/profile',requested:true});
 expect(html).toContain('request has been received');expect(html).not.toContain('Your visit is confirmed');
});
