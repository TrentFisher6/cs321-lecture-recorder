import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

// Link to a website outside the app. Opens an in-app browser on phones and a new
// tab on web, so users do not lose their place in the app.
//
// Best practices:
// - Use this for outside URLs only. For screens inside the app, use Link or
//   router from expo-router.
// - Omit<..., 'href'> reuses Link's props while narrowing href to a string URL.
// - Link text should say where it goes ("Course syllabus"), not "click here".
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
