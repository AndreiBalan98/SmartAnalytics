from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import ClientPermissions
from .serializers import (
    AgencySignupSerializer,
    ClientCreationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def agency_signup(request):
    serializer = AgencySignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Agency account created successfully',
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_agency_client(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can create clients'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ClientCreationSerializer(data=request.data)
    if serializer.is_valid():
        client_user = serializer.save()
        client_user.agency = request.user
        client_user.save()

        ClientPermissions.objects.create(user=client_user)

        response_data = {
            'message': 'Client created successfully',
            'user': UserSerializer(client_user).data,
        }
        if hasattr(client_user, '_generated_password'):
            response_data['temporary_password'] = client_user._generated_password

        return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user_data = UserSerializer(request.user).data

    if request.user.user_type in ('client', 'agency_client'):
        try:
            perms = request.user.permissions
            user_data['permissions'] = {
                'meta_accounts_ids': perms.meta_accounts_ids,
                'google_accounts_ids': perms.google_accounts_ids,
                'ga4_properties_ids': perms.ga4_properties_ids,
                'meta_form_ids': perms.meta_form_ids,
            }
        except ClientPermissions.DoesNotExist:
            user_data['permissions'] = None

    return Response(user_data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_preferences(request):
    dark_mode = request.data.get('dark_mode')
    if dark_mode is not None:
        if not isinstance(dark_mode, bool):
            return Response({'error': 'dark_mode must be a boolean'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.dark_mode = dark_mode
        request.user.save()

    return Response({
        'message': 'Preferences updated successfully',
        'user': UserSerializer(request.user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_agency_clients(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    clients = User.objects.filter(agency=request.user).select_related('permissions')
    clients_data = []
    for client in clients:
        client_info = UserSerializer(client).data
        try:
            perms = client.permissions
            client_info['permissions'] = {
                'meta_accounts_ids': perms.meta_accounts_ids,
                'google_accounts_ids': perms.google_accounts_ids,
                'ga4_properties_ids': perms.ga4_properties_ids,
                'meta_form_ids': perms.meta_form_ids,
            }
        except ClientPermissions.DoesNotExist:
            client_info['permissions'] = None
        clients_data.append(client_info)

    return Response({
        'clients': clients_data,
        'total': len(clients_data),
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_client_permissions(request, client_id):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can update client permissions'}, status=status.HTTP_403_FORBIDDEN)

    try:
        client = User.objects.get(id=client_id, agency=request.user)
    except User.DoesNotExist:
        return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

    perms, _ = ClientPermissions.objects.get_or_create(user=client)

    if 'meta_accounts_ids' in request.data:
        perms.meta_accounts_ids = request.data['meta_accounts_ids']
    if 'google_accounts_ids' in request.data:
        perms.google_accounts_ids = request.data['google_accounts_ids']
    if 'ga4_properties_ids' in request.data:
        perms.ga4_properties_ids = request.data['ga4_properties_ids']
    if 'meta_form_ids' in request.data:
        perms.meta_form_ids = request.data['meta_form_ids']
    perms.save()

    return Response({
        'message': 'Permissions updated successfully',
        'permissions': {
            'meta_accounts_ids': perms.meta_accounts_ids,
            'google_accounts_ids': perms.google_accounts_ids,
            'ga4_properties_ids': perms.ga4_properties_ids,
            'meta_form_ids': perms.meta_form_ids,
        },
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_client(request, client_id):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can remove clients'}, status=status.HTTP_403_FORBIDDEN)

    try:
        client = User.objects.get(id=client_id, agency=request.user)
    except User.DoesNotExist:
        return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

    client.is_active = False
    client.save()

    return Response({'message': 'Client removed successfully'})
