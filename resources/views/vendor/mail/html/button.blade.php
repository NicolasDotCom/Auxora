@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; margin: 28px auto; padding: 0; text-align: center; width: 100%;">
<tr>
<td align="{{ $align }}" style="box-sizing: border-box; padding: 0;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box;">
<tr>
<td align="{{ $align }}" style="box-sizing: border-box; padding: 0;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $url }}" style="height:44px;v-text-anchor:middle;width:280px;" arcsize="12%" strokecolor="#2563eb" fillcolor="#2563eb">
<w:anchorlock/>
<center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:600;">{{ $slot }}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="{{ $url }}" target="_blank" rel="noopener" style="box-sizing: border-box; display: inline-block; text-decoration: none; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); background-color: #2563eb; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; line-height: 1; padding: 14px 32px; border-radius: 10px; text-align: center; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35), 0 1px 3px rgba(0,0,0,0.1); mso-hide: all;">{!! $slot !!} &nbsp;→</a>
<!--<![endif]-->
</td>
</tr>
</table>
</td>
</tr>
</table>
