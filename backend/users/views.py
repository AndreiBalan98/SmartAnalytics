from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from agencies.models import Agency, AgencyUser
from .serializers import (
    AgencySignupSerializer,
    ClientCreationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user info in response.
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def agency_signup(request):
    """
    Agency signup endpoint.
    Creates a new agency user and automatically creates an Agency entity.
    """
    serializer = AgencySignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Automatically create an Agency for this user
        agency_name = request.data.get('agency_name', f"{user.get_full_name()}'s Agency")
        agency = Agency.objects.create(
            name=agency_name,
            owner=user,
            email=user.email
        )

        return Response({
            'message': 'Agency account created successfully',
            'user': UserSerializer(user).data,
            'agency': {
                'id': agency.id,
                'name': agency.name
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_client(request):
    """
    Endpoint for agencies to create client users.
    Only accessible by agency users.
    Creates a client user and links them to the agency with permissions.
    """

    # Verify user is an agency owner
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can create clients'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the agency owned by this user
    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ClientCreationSerializer(data=request.data)

    if serializer.is_valid():
        client_user = serializer.save()

        # Get permissions from request (optional)
        permissions = request.data.get('permissions', {})

        # Create AgencyUser relationship
        agency_user = AgencyUser.objects.create(
            agency=agency,
            user=client_user,
            permissions=permissions
        )

        response_data = {
            'message': 'Client created successfully',
            'user': UserSerializer(client_user).data,
            'agency_user_id': agency_user.id
        }

        # Include generated password if it was auto-generated
        if hasattr(client_user, '_generated_password'):
            response_data['temporary_password'] = client_user._generated_password
            response_data['note'] = 'Send this temporary password to the client securely'

        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user information.
    """
    serializer = UserSerializer(request.user)
    user_data = serializer.data

    # Add agency information if user is agency owner
    if request.user.user_type == 'agency':
        try:
            agency = Agency.objects.get(owner=request.user)
            user_data['agency'] = {
                'id': agency.id,
                'name': agency.name,
                'email': agency.email
            }
        except Agency.DoesNotExist:
            user_data['agency'] = None

    # Add agency memberships if user is a client
    elif request.user.user_type == 'client':
        memberships = AgencyUser.objects.filter(user=request.user, is_active=True)
        user_data['agencies'] = [
            {
                'agency_id': membership.agency.id,
                'agency_name': membership.agency.name,
                'permissions': membership.permissions
            }
            for membership in memberships
        ]

    return Response(user_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_agency_clients(request):
    """
    List all clients for the authenticated agency user.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get all clients linked to this agency
    agency_users = AgencyUser.objects.filter(agency=agency).select_related('user')

    clients_data = [
        {
            'id': agency_user.id,
            'user': UserSerializer(agency_user.user).data,
            'permissions': agency_user.permissions,
            'is_active': agency_user.is_active,
            'invited_at': agency_user.invited_at
        }
        for agency_user in agency_users
    ]

    return Response({
        'agency': {
            'id': agency.id,
            'name': agency.name
        },
        'clients': clients_data,
        'total': len(clients_data)
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_client_permissions(request, client_id):
    """
    Update permissions for a specific client.
    Only accessible by agency owner.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can update client permissions'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get the AgencyUser relationship
    try:
        agency_user = AgencyUser.objects.get(id=client_id, agency=agency)
    except AgencyUser.DoesNotExist:
        return Response({
            'error': 'Client not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Update permissions
    new_permissions = request.data.get('permissions', {})
    agency_user.permissions = new_permissions
    agency_user.save()

    return Response({
        'message': 'Permissions updated successfully',
        'client_id': agency_user.id,
        'permissions': agency_user.permissions
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_client(request, client_id):
    """
    Remove a client from the agency (soft delete - set is_active=False).
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can remove clients'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        agency_user = AgencyUser.objects.get(id=client_id, agency=agency)
    except AgencyUser.DoesNotExist:
        return Response({
            'error': 'Client not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Soft delete
    agency_user.is_active = False
    agency_user.save()

    return Response({
        'message': 'Client removed successfully'
    })